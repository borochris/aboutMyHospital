/*
	Hospital Information Demonstrator
	Author: Chris Casey
	Copyright 2014 CPC Computer Solutions Ltd.
 
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
 
       http://www.apache.org/licenses/LICENSE-2.0
 
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};
var getHospital = function(ewd,row) {
	if (!thisHospitalPtr) var thisHospitalPtr = new ewd.mumps.GlobalNode("cpcHospital", ["Hospitals",row]);
	return thisHospitalPtr._getDocument();
}
var cpcLogin = function(accessCode, verifyCode, ewd) {
  var authP = new ewd.mumps.GlobalNode('%zewdTemp', [process.pid]);
  authP._delete();
  authP._setDocument({
    inputs:{
      password: verifyCode,
      username: accessCode,
	  application: 'aboutMyHospital'
    }
  });
  var result = ewd.mumps.function('login^ZZCPCH00', '');
  if (result === '') {
    var document = authP._getDocument();
    return {
      error: false,
      outputs: document.outputs
    };
  }
  else{
    return {error: result};
  }
};
//add verification to this user/email combination
var addVerify = function(username,emailAdd,ewd) {
  var authP = new ewd.mumps.GlobalNode('%zewdTemp', [process.pid]);
  authP._delete();
  authP._setDocument({
    inputs:{
      mail: emailAdd,
      username: username,
	  application: 'aboutMyHospital'
    }
  });
  var result = ewd.mumps.function('addMailVerify^ZZCPCH00', '');
  if (result === '') {
    var document = authP._getDocument();
    return document.outputs.verified;
  }
  else {
    return {error: result};
  }
};

//check to see if this user/email combination is verified
var checkVerify = function(username,emailAdd,ewd) {
  var authP = new ewd.mumps.GlobalNode('%zewdTemp', [process.pid]);
  authP._delete();
  authP._setDocument({
    inputs:{
      mail: emailAdd,
      username: username,
	  application: 'aboutMyHospital'
    }
  });
  var result = ewd.mumps.function('checkVerify^ZZCPCH00', '');
  if (result === '') {
    var document = authP._getDocument();
    return {error:false,verified:document.outputs.verified};
  }
  else {
    return {error: result,verified:false};
  }
};
module.exports = {
	//external call - check reload
	swagger: function(ewd,path) {
		if (!hDocsix) var hDocsix = new ewd.mumps.GlobalNode("cpcHospital", ["Documentation"]);
		
		if (path) {
			ewd.log('**************** '+JSON.stringify(path)+' ************** '+path.length+' **************************',1)
			if (path.length > 2  && path[2] !='' ) {
				return hDocsix.$(path[2])._getDocument();
				}
			}
		
		return hDocsix.$('control')._getDocument();
	},
	getHospitalByCode: function(ewd,hCode) {
		if (!hCodeIndex) var hCodeIndex = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","id"]);
		var id = hCodeIndex.$(hCode)._next('');
		if (id==='') return {error: 'Hospital with that Id Not Found'};
		return getHospital(ewd,id);
	},
	getHospitalWifiByCode: function(ewd,hCode) {
	 var ret=this.getHospitalByCode(ewd,hCode);
	 if (ret.error) return ret.error;
	 if (!ret.wifi) return {error:'No wifi details for this hospital'};
	 return ret.wifi;
	},
	getHospitalParkingByCode: function(ewd,hCode) {
	 var ret=this.getHospitalByCode(ewd,hCode);
	 if (ret.error) return ret.error;
	 if (!ret.Parking) return {error:'No parking details for this hospital'};
	 return ret.Parking;
	},
  onSocketMessage: function(ewd) {
  	var myMail;
	if (!myMail) myMail=ewd.util.requireAndWatch('mailHandlers');
    var wsMsg = ewd.webSocketMessage;
    var type = wsMsg.type;
    var params = wsMsg.params;
    var sessid = ewd.session.$('ewd_sessid')._value;
    if (type === 'EWD.form.login') {
		if (params.username === '') return 'You must enter a username';
		if (params.password === '') return 'You must enter a password';
		var result=cpcLogin(params.username,params.password,ewd)
		var error=result.error;
		if (error) return error;
		if (!error) {
			var name = result.outputs.name; //'Someone with a long name' ; //ewd.session.$('outputs').$('displayName')._value;
        ewd.session.setAuthenticated();
        ewd.sendWebSocketMsg({
          type: 'loggedInAs',
          message: {
            fullName: name,
			adminUser:result.outputs.aministrator
          }
        });
		return;
      }
      return error;
    }
	//--------------- this code can run un-authenticated ----------------------------------
	if (type == 'wifiQuery') {
		if (!wifiIndex) var wifiIndex = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","wifi"]);
		var results = [];
		var hospitals = {};
		var i=0;
		wifiIndex._forEach(function(id) {
			var onehospital=getHospital(ewd,id);
			if (onehospital.wifi.exists) {
				i++;
				//if (i > 40) return true;
				results.push({id: id, hospitalId:onehospital.HospitalId,name: onehospital.Hospital_Name,data:onehospital});
				hospitals[id] = onehospital;
			}
		});
      ewd.session.$('hospitals')._delete();
      ewd.session.$('hospitals')._setDocument(hospitals);
	  ewd.sendWebSocketMsg({
        type: 'hospitalSummaryList',
        message: results
      });
    return;
	}
	if (type == 'getStats') {
		if (!statsIndex) var statsIndex =  new ewd.mumps.GlobalNode("cpcHospital", ["Hospitals"]);
		var lastIx=statsIndex._last;
		if (!wifiIndex) var wifiIndex = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","wifi"]);
		var totWifi = wifiIndex._count();
		if (!parkIndex) var parkIndex = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","Parking"]);
		var totPark = parkIndex._count();

		ewd.sendWebSocketMsg({
			type: 'hospitalStats',
			message: {
				total:lastIx,
				totalWifiKnown:totWifi,
				totalParkKnown: totPark
				}
		});
		return;
	}
	if (type == 'getParkingStats') {
		if (!parkIndex) var parkIndex = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","Parking"]);
		var avgParkV=0;
		var allParkV=0;
		var highParkV={
			intId:0,
			Id:'',
			name:'',
			cost:0
		};
		var avgParkS=0;
		var allParkS=0;
		var highParkS={
			intId:0,
			Id:'',
			name:'',
			cost:0
			};
		var count=0;
		parkIndex._forEach(function(id) {
			count++;
			if (!thisHospitalPtr) var thisHospitalPtr = new ewd.mumps.GlobalNode("cpcHospital", ["Hospitals",id]);
			var parking=thisHospitalPtr.$('Parking')._getDocument(1);
			//var onehospital=getHospital(ewd,id);
      //if (!isNan(parking.Average_hourly_fee)) {
        allParkV=allParkV+Number(parking.Average_hourly_fee);
      //};
			allParkS=allParkS+parking.Average_hourly_Staff_fee;
			if (highParkS.cost < parking.Average_hourly_Staff_fee) {
				highParkS.cost=parking.Average_hourly_Staff_fee;
				highParkS.intId=id;
				highParkS.Id=thisHospitalPtr.$('HospitalId')._value;
				highParkS.name=thisHospitalPtr.$('Hospital_Name')._value;
			}
			if (highParkV.cost < parking.Average_hourly_fee) {
				highParkV.cost=parking.Average_hourly_fee;
				highParkV.intId=id;
				highParkV.Id=thisHospitalPtr.$('HospitalId')._value;
				highParkV.name=thisHospitalPtr.$('Hospital_Name')._value;
			}
		})
		avgParkS=(allParkS/count).toFixed(2);
		avgParkV=(allParkV/count).toFixed(2);
		return {highPublic:highParkV,highStaff:highParkS,averagePublic:avgParkV,averageStaff:avgParkS};
	}
	if (type == 'getSurveyResults') {
		if (!surveyQix) var surveyQix = new ewd.mumps.GlobalNode("cpcHospital", ["surveyQuestions",0]);
		var surveyQuestions=surveyQix._getDocument();
		if (!surveyAix) var surveyAix = new ewd.mumps.GlobalNode("cpcHospital", ["surveyAnswers"]);
		var surveyAnswers=surveyAix._getDocument();
		ewd.sendWebSocketMsg({
			type: 'surveyResults',
			message : {
				questions: surveyQuestions,
				answers: surveyAnswers
			}
		})
	}
	if (type == 'cityQuery') {
      if (!townIndex) var townIndex = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","Town"]);
      var results = [];
	  var cities=[];
      var hospitals = {};
      var i = 0;var j=0;
      townIndex._forPrefix(params.prefix.toUpperCase(), function(name, node) {
		i++;
		if (i > 20) return true;
		cities.push({id:i,text:name});
        node._forEach(function(id) {
		  var onehospital=getHospital(ewd,id);
		  if (onehospital.SiteType) {
			  if (onehospital.close_date === '') {
				  j++;
				  if (!params.final) {if (j > 40) return true};
				  if (params.final) {if (j > 120) return true};
				  results.push({id: id, hospitalId:onehospital.HospitalId,name: onehospital.Hospital_Name,data:onehospital});
				  hospitals[id] = onehospital;
			  }
		  }
        });
        if (i > 40) return true;
      });
      ewd.session.$('hospitals')._delete();
      ewd.session.$('hospitals')._setDocument(hospitals);
      ewd.sendWebSocketMsg({
        type: 'cityMatches',
        message: cities
      });
	  ewd.sendWebSocketMsg({
        type: 'hospitalSummaryList',
        message: results
      });
      return;
	}
	if (type == 'postCodeQuery') {
      if (!postCodeIndex) var postCodeIndex = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","PostCode"]);
      var results = [];
	  var postCodes=[];
      var hospitals = {};
      var i = 0;var j=0;
	  var thisPrefix=params.prefix.toUpperCase();
	  var pushedThis=[];
      postCodeIndex._forPrefix(thisPrefix, function(name, node) {
		var shortPost=name.split(' ')[0];
		i++;
		if (i > 40) return true;
		if (thisPrefix.split(' ').length ==1 ) {
			//entered postcode 1st part only
				if (!pushedThis[shortPost]) {
					pushedThis[shortPost]=true;
					postCodes.push({id:i,text:shortPost});
					}
			}
		else {postCodes.push({id:i,text:name});}
        if (!params.final || (shortPost == thisPrefix)) {
			node._forEach(function(id) {
			  var onehospital=getHospital(ewd,id);
			  if (onehospital.SiteType) {
				  if (onehospital.close_date === '') {
					  j++;
					  if (j > 40) return true;
					  results.push({id: id, hospitalId:onehospital.HospitalId,name: onehospital.Hospital_Name,data:onehospital});
					  hospitals[id] = onehospital;
				  }
			  }
			});
		}
        if (i > 40) return true;
      });
      ewd.session.$('hospitals')._delete();
      ewd.session.$('hospitals')._setDocument(hospitals);
      ewd.sendWebSocketMsg({
        type: 'postCodeMatches',
        message: postCodes
      });
	  ewd.sendWebSocketMsg({
        type: 'hospitalSummaryList',
        message: results
      });
      return;
	}
	if (type == 'hospitalQuery') {
      if (!hospitalIndex) var hospitalIndex = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","Name"]);
      var results = [];
	  var hospitals=[];
      var hospitalObj = {};
      var i = 0;var j=0;
      hospitalIndex._forPrefix(params.prefix.toUpperCase(), function(name, node) {
		i++;
		if (i > 40) return true;
		hospitals.push({id:i,text:name});
        node._forEach(function(id) {
		  var onehospital=getHospital(ewd,id);
		  if (onehospital.close_date === '') {
			  j++;
			  if (j > 40) return true;
			  results.push({id: id, hospitalId:onehospital.HospitalId,name: onehospital.Hospital_Name,data:onehospital});
			  hospitalObj[id] = onehospital;
		  }
        });
        if (i > 40) return true;
      });
      ewd.session.$('hospitals')._delete();
      ewd.session.$('hospitals')._setDocument(hospitalObj);
	  if (!params.final) {
		  ewd.sendWebSocketMsg({
			type: 'hospitalMatches',
			message: hospitals
		  });
	  };
	  ewd.sendWebSocketMsg({
        type: 'hospitalSummaryList',
        message: results
      });
      return;
	}
	//this used to be secure only but have opened up to allow unauthenticated input
	if (type === 'saveParkData') {
		var intId=params.intId;
		if (params.EditedBy == '') return {error: 'A username must be entered'};
		if (!isNumber(params.visitorCost)) return {error: 'Visitor parking cost must be numeric'};
		if (!isNumber(params.staffCost)) return {error: 'Staff parking cost must be numeric'};
		var auditGbl = new ewd.mumps.GlobalNode("cpcHospitalAudit",[]);
		var lastAuditIx = auditGbl._last;
		lastAuditIx++;
		var changed=false;
		var newDataGbl = new ewd.mumps.GlobalNode("cpcHospital", ["Hospitals",intId]);
		var newDataIx = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","Parking",intId,"data"]);
		var data=newDataGbl._getDocument();
		var timeStamp = new Date().toUTCString();
		var oldRec=data.Parking || {};
		var auditData={
			Type: 'Parking',
			Id: intId,
			HospitalId: data.HospitalId,
			timeStamp: timeStamp,
			user: params.EditedBy,
			changes: {}
		};
		if (params.visitorCost != oldRec.Average_hourly_fee) {
			changed=true;
			auditData.changes.Average_hourly_fee = {
				original : oldRec.Average_hourly_fee || '',
				revised : params.visitorCost
				}
			newDataGbl.$('Parking').$('Average_hourly_fee')._value = params.visitorCost;
			};
		if (params.staffCost != oldRec.Average_hourly_Staff_fee) {
			changed=true;
			auditData.changes.Average_hourly_Staff_fee = {
				original : oldRec.Average_hourly_Staff_fee || '',
				revised : params.staffCost
				}
			newDataGbl.$('Parking').$('Average_hourly_Staff_fee')._value = params.staffCost;
			};
		if (changed) {
			newDataGbl.$('Parking').$('editedBy')._value = params.EditedBy;
			newDataIx._value = true;
			auditGbl.$(lastAuditIx)._setDocument(auditData);
			return {
				error:false,
				message:'updated '+intId
			};
		}
		else {
			return {error:'Nothing changed'};
		};
	}
	if (type === 'saveWifiData') {
		console.log('**** saving wifi');
		var intId=params.intId;
		if (params.EditedBy == '') return {error: 'A username must be entered'};
		var auditGbl = new ewd.mumps.GlobalNode("cpcHospitalAudit",[]);
		var lastAuditIx = auditGbl._last;
		lastAuditIx++;
		var newDataGbl = new ewd.mumps.GlobalNode("cpcHospital", ["Hospitals",intId]);
		var newDataIx = new ewd.mumps.GlobalNode("cpcHospitalIx", ["Hospitals","wifi",intId,"data"]);
		var data=newDataGbl._getDocument();
		var timeStamp = new Date().toUTCString();
		var oldRec=data.wifi || {};
		var auditData={
			Type: 'wifi',
			Id: intId,
			HospitalId: data.HospitalId,
			timeStamp: timeStamp,
			user: params.EditedBy,
			changes: {}
		};
		if (params.Exists) params.Exists="True"
		data.wifi={
			exists: params.Exists,
			open: params.Open,
			openStaff: params.OpenStaff,
			free: params.Free,
			freeStaff: params.FreeStaff,
			cost: params.Cost,
			costStaff: params.CostStaff,
			editedBy: params.EditedBy,
			comment: params.Comment
		};
		var newRec=data.wifi;
		if (params.testFlag) return {error:false, message:'got test message'};
		for (var fld in newRec) {
			if (newRec[fld] != oldRec[fld]) {
				auditData.changes[fld]={
					original: oldRec[fld] || '',
					revised: newRec[fld] 
				};
			}
		};
		newDataGbl._setDocument(data);
		newDataIx._value = true;
		auditGbl.$(lastAuditIx)._setDocument(auditData);
		console.log('****  finished saving wifi');
		return {
			error:false,
			message:'updated '+intId
			};
	}
	if (type === 'checkVerify') {
		return checkVerify(params.username,params.emailAddr,ewd);
	};
	if (type === 'addVerify') {
		return addVerify(params.username,params.emailAddr,ewd);
	}
	if (myMail.onSocketMessage(ewd)) return;
	//-------------------------------------------------------------------------------------
	//--------------- don't go past this point unless Authenticated -----------------------
    if (!ewd.session.isAuthenticated) {
		ewd.sendWebSocketMsg({
          type: 'unknownMessage',
          message: {
            text: 'An unknown or unauthorised message was received by the server process, message type: '+type
          }
        });
		return;
		}
	if (type === 'loadDumpData') {
		var table=params.table;
		var data=params.data;
		var hospital= new ewd.mumps.GlobalNode("cpcHospital",[table])
		var lastIx=hospital._last;
		if (lastIx) lastIx++;
		for (var ix=0;ix<data.length;ix++) {
			var newDataGbl = new ewd.mumps.GlobalNode("cpcHospital", [table,lastIx+ix]);
			newDataGbl._setDocument(data[ix]);
		}
		return;
	}
	ewd.sendWebSocketMsg({
          type: 'unknownMessage',
          message: {
            text: 'An unknown message was received by the server process, message type: '+type
          }
        });
  }
};

