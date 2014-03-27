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
EWD.sockets.log=false;
EWD.testFlag=0;
EWD.application = {
  name: 'aboutMyHospital',
  currentPanel:'',
  previousPanel:'',
  currentList:{},
  framework:'bootstrap',
  
  onStartup: function() {
  }
};
var convertFtoStringDateUS= function(x) {
	var x=x.toString();
	var t=x.slice(8,11);
	if (t.length==1) t=t+'0:00'
	else if (t.length==2) t=t+':00'
	else if (t.length==3) t=t.slice(0,2)+':'+t.slice(2)+'0'
	else t=t.slice(0,1)+':'+t.slice(2,4);
	x=x.slice(3,5)+'/'+x.slice(5,7)+'/'+(parseInt(x.slice(0,3))+1700)+' '+t; 
	return x
	}

/*
$(document).ready(function() {
  EWD.isReady();
});
*/
var swapPanel= function(pnl) {
	console.log('swapping to '+pnl);
	var oldp=$('#'+EWD.application.currentPanel)
	var newp=$('#'+pnl)
	hideDetail();
	oldp.hide();
	newp.show();	
	EWD.application.currentPanel=pnl;
	return;
};
var showDetail = function() {
	$('#vitalGraphHolder').hide();
	$('#listHolder').removeClass('col-sm-12').addClass('col-sm-8');
	$('#detailHolder').show();
};
var hideDetail = function() {
	$('#listHolder').removeClass('col-sm-8').addClass('col-sm-12');
	$('#detailHolder').hide();
	$('#vitalGraphHolder').hide();
};
var getLoc=function(location) {
	//location.coords.latitude
}
dogetloc=function() {navigator.geolocation.getCurrentPosition(getLoc);}
	//take any Vista table format JSON object and make it a table
dispJSON = function(jobj,debug) {
	var jtext='<table class="table table-condensed table-striped "><tbody>';
	var del='<tr><td>',dela='</td></tr>',deli='</td><td>' ;
	var inTable=false
	function jsDebug(p,x) {console.log(p+':'+x)};
	function jsInside(jobj) {
		for (var i in jobj) {
			if (debug) jsDebug(1,i+' '+typeof jobj[i]);
			if (typeof jobj[i] == 'object') {
				if (inTable) {
					if (debug) jsDebug(4,typeof i);
					if ((i>0)) {
						if (debug) jsDebug(5,i)
					}
					else {
						//jtext=jtext+'</tbody></table></tr>';
						inTable=false;
					}
				}
				if (jobj[i].E !==undefined) {
					if (debug) jsDebug(2,i);
					if (jobj[i][1] !=undefined) {
						jtext=jtext+del+i+deli;
						var space='';
						for (var cl=1;(jobj[i][cl]);cl++) {
							jtext=jtext+space+jobj[i][cl];
							space=' ';
							};
						jtext=jtext+dela;
						continue;					
					};
					jtext=jtext+del+i+deli+jobj[i].E+dela;
					continue;
				}
				if (debug) EWD.loop=jobj[i];
				if (jobj[i] instanceof Array) {
					 //jtext=jtext+'<tr><table class="table table-condensed"><th>'+i+'</th><tbody>'
					 inTable=true;
					if (debug) {
					 jsDebug(3,i+' is array');
					 }
				}
				jsInside(jobj[i]);
				}
			else {
				jtext=jtext+del+i+deli+jobj[i]+dela;
				};
		}
	};
	jsInside(jobj);
	return jtext+'</tbody></table>';
};
var toggle=function(e) {
	e.preventDefault();
	$('.active').toggleClass('active', false);
	var current=e.currentTarget.id;
	$('#'+current).toggleClass("active", true);
	return;
};
EWD.onSocketsReady = function() {
	EWD.sockets.sendMessage({
			type: 'wifiQuery',
			params: {prefix: ''}
	});
	EWD.sockets.sendMessage({type: 'getStats', params:{}});
	$("#selectedHospital").select2({
		placeholder: "Hospital name",
		minimumInputLength: 4,
		query: function (query) {
		  EWD.application.select2H = {callback: query.callback,};
		  EWD.sockets.sendMessage({
			type: 'hospitalQuery',
			params: {prefix: query.term,final:false}
		  });
		}
	})
	.on('change',function(e) {
		EWD.sockets.sendMessage({
			type: 'hospitalQuery',
			params: {prefix:e.added.text,final:true}
		})
	})
	$("#selectedPostCode").select2({
		minimumInputLength: 2,
		placeholder: "PostCode",
		query: function (query) {
		  EWD.application.select2P = {callback: query.callback,};
		  EWD.sockets.sendMessage({
			type: 'postCodeQuery',
			params: {prefix: query.term,final:false}
		  });
		}
	})
	.on('change',function(e) {
		EWD.sockets.sendMessage({
			type: 'postCodeQuery',
			params: {prefix:e.added.text,final:true}
		})
	})
	$("#selectedCity").select2({
		minimumInputLength: 3,
		placeholder: "Town/City",
		query: function (query) {
		  EWD.application.select2C = {callback: query.callback,};
		  EWD.sockets.sendMessage({
			type: 'cityQuery',
			params: {prefix: query.term,final:false}
		  });
		}
	})
	.on('change',function(e) {
		EWD.sockets.sendMessage({
			type: 'cityQuery',
			params: {prefix:e.added.text,final:true}
		})
	})
	$("#selectedTrust").select2({
		minimumInputLength: 3,
		placeholder: "Trust",
		query: function (query) {
		  EWD.application.select2T = {callback: query.callback,};
		  EWD.sockets.sendMessage({
			type: 'trustQuery',
			params: {prefix: query.term,final:false}
		  });
		}
	})
	.on('change',function(e) {
		EWD.sockets.sendMessage({
			type: 'trustQuery',
			params: {prefix:e.added.text,final:true}
		})
	})
	//
	  // Login form button handler
	  $('body').on( 'click', '#loginFormBtn', function(event) {
		event.preventDefault(); event.stopPropagation();
		EWD.sockets.submitForm({
		  fields: {
			username: $('#username').val(),
			password: $('#password').val()
		  },
		  messageType: 'EWD.form.login'
		}); 
	  });
	  $('body').on( 'click', '#loadDataBtn', function(event) {
		event.preventDefault();
		event.stopPropagation(); // prevent default bootstrap behavior
		$('#loadDataPanel').modal('show');
	  });
	  $('body').on('click','#showSurveyBtn', function(event) {
	  	event.preventDefault(); event.stopPropagation();
		if ($('#showSurveyBtn').text() == 'Show Raw Survey Results') {
			EWD.sockets.sendMessage({type: 'getSurveyResults',params:{}})
			$('#menuHolder').hide();
			$('#listHolder').hide();
			$('#detailHolder').hide();
			$('#summaryPage').hide();
			$('#surveyListPnl').show();
		}
		else {
			$('#menuHolder').show();
			$('#listHolder').show();
			$('#summaryPage').show();
			$('#surveyListPnl').hide();
			$('#showSurveyBtn').text('Show Raw Survey Results');
		}
	  });
	$('body').on('click','#loadDataFormBtn', function(event) {
		event.preventDefault(); event.stopPropagation(); // prevent default bootstrap behavior
		dumpData=$('#dataDump').val();
		dumpDataJson=CSV2JSON(dumpData);
		EWD.sockets.sendMessage({
			type: 'loadDumpData',
			params: {
				table: $('#dumptableName').val(),
				data: dumpDataJson
			}
		});
	});
	//all checkbox visual handling here
	$('.checkbox').children().on('click',function() {
		var checkId=this.children[0].id;
		var itsOn=$('#'+checkId+'').is(':checked');
		if (checkId == 'wifiFormCb3_2') { //free for staff
			if (itsOn) {
				$('#staffcostform').hide();
				if ($('#wifiFormCb3').is(':checked')) $('#allcostform').hide();
			};
			if (!itsOn) {
				$('#staffcostform').show();
				$('#allcostform').show();
			};
		}
		if (checkId== 'wifiFormCb3') { //change this to point to proper checkbox 
			if (itsOn) {
				$('#patientcostform').hide();
				if ($('#wifiFormCb3_2').is(':checked')) $('#allcostform').hide();
			};
			if (!itsOn) {
				$('#patientcostform').show();
				$('#allcostform').show();
				};
		}
		//showit=$(this);
		//console.log('checkbox '+checkId+' is '+$('#'+checkId+'').is(':checked'));
	});
	$('body').on('click','#wifiFormBtn', function(event) {
		event.preventDefault(); event.stopPropagation(); // prevent default bootstrap behavior
		EWD.sockets.sendMessage({
			type: 'saveWifiData',
			params: {
				id: $('#wifiFormHospitalId').text(),
				intId: $('#wifiFormHospitalIntId').text(),
				Exists: $('#wifiFormCb1').is(':checked'),
				Open: $('#wifiFormCb2').is(':checked'),
				OpenStaff: $('#wifiFormCb2_2').is(':checked'),
				Free: $('#wifiFormCb3').is(':checked'),
				FreeStaff: $('#wifiFormCb3_2').is(':checked'),
				Cost: $('#wifiCost').val(),
				CostStaff: $('#wifiCost_2').val(),
				EditedBy: $('#EditedByName').val(),
				Comment: $('#wifiComment').val(),
				testFlag: EWD.testFlag
			}
		});
	});
};

EWD.onSocketMessage = function(messageObj) {
	console.log('message received: '+messageObj.type);
	if (messageObj.type === 'EWD.form.login') {
		//$('#loginModalPanel').hide();
		$('#loginModalPanel').modal('hide');
		return;
	}
	if (messageObj.type === 'loggedInAs') {
		if (messageObj.message.adminUser) {
			$('#loadDataBtn').show();
			$('#wifiFormBtn').show();
		}
		return;
	}
	if (messageObj.type === 'cityMatches') {
		EWD.application.select2C.results = messageObj.message;
		EWD.application.select2C.callback(EWD.application.select2C);
		return;
	}
	if (messageObj.type === 'hospitalMatches') {
		EWD.application.select2H.results = messageObj.message;
		EWD.application.select2H.callback(EWD.application.select2H);
		return;
	}
	if (messageObj.type === 'postCodeMatches') {
		EWD.application.select2P.results = messageObj.message;
		EWD.application.select2P.callback(EWD.application.select2P);
		return;
	}
	if (messageObj.type === 'trustMatches') {
		EWD.application.select2T.results = messageObj.message;
		EWD.application.select2T.callback(EWD.application.select2T);
		return;
	}
	if (messageObj.type === 'hospitalStats') {
		var statsData=[
			{color:'#0000FF', label:'all sites ('+messageObj.message.total+')', data:messageObj.message.total},
			{color:'#FF0000',label:'known Wifi ('+messageObj.message.totalWifiKnown+')', data:messageObj.message.totalWifiKnown},
			{color:'#00FF00',label:'known Parking ('+messageObj.message.totalParkKnown+')', data:messageObj.message.totalParkKnown}
		];
		$.plot('#graphHolder', statsData, {
			series: {
				pie: {
					show: true,
					radius: 3/4			
				}
			},
			legend: {show:true}
		});
		return;
	}
	if (messageObj.type === 'saveWifiData') {
		if (messageObj.message.error) {
			toastr.warning(messageObj.message.error);
			return;
			};
		if (messageObj.message.message) {
			toastr.success(messageObj.message.message);
		}
		return;
	}
	if (messageObj.type === 'surveyResults') {
		//console.log('hospitalList: '+ JSON.stringify(messageObj,2));
		var questions=messageObj.message.questions;
		var answers=messageObj.message.answers;
		//var order=['ID','q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','q13','q14','q15','q16','q17','q18'];
		var order=['ID','q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q17','q18'];
		var columns=[{'sTitle':'ID'}];
		for (var i=1;i<order.length;i++) { //yes I know it atarts from 1
			if (i!=2 && i!=4 && i!=6) columns.push({'sTitle':questions[order[i]]})
			};
		qData=[];
		for (var i=0;i<answers.length;i++) {
			var data=[];
			for (var j=0;j<order.length;j++) {
				if ((j == 1 || j==3 || j==5) && answers[i][order[j+1]] !='') {
					data.push(answers[i][order[j]] + ' (' + answers[i][order[j+1]] + ')');
					continue;
					}
				if (j!=2 && j!=4 && j!=6) data.push(answers[i][order[j]]);
			}
			qData.push(data);
		};
		
		var surveyListTableDT=$('#surveyListTable').dataTable({
			'bDestroy':true,
			'aaData': qData,
			'aoColumns': columns
		}).css('width','');
		$('#showSurveyBtn').text('hide survey results')
		return;
	}
	if (messageObj.type === 'hospitalSummaryList') {
		var aaData=[];
		EWD.application.currentList={};
		var data=messageObj.message;
		for (var i=0;i<data.length;i++) {
			var wifi='?';
			if (data[i].data.wifi) {
				wifi= (data[i].data.wifi.exists) ? 'Yes' : 'No';
				}
			aaData.push(
				[
				data[i].id,
				data[i].hospitalId,
				data[i].name,
				data[i].data.SiteType || '',
				data[i].data.Address_line_4,
				wifi
				]
				);
			EWD.application.currentList[data[i].hospitalId]=data[i].data;
			EWD.application.currentList[data[i].hospitalId].id=data[i].id;
		};
		var hospitalListTableDT=$('#hospitalListTable').dataTable({
			'bDestroy':true,
			'aaData': aaData,
			'aoColumns': [
				{'bVisible':false},{'sTitle':'Id'},{'sTitle':'Name'},{'sTitle':'SiteType'},{'sTitle':'Town'},{'sTitle':'Wifi'}
			]
		}).css('width','');
		$(hospitalListTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			var thisHospId=e.currentTarget.firstChild.textContent;
			var thisHosp=EWD.application.currentList[thisHospId];
			$('#wifiFormHospitalName').text(thisHosp.Hospital_Name);
			$('#wifiFormHospitalId').text(thisHospId);
			$('#wifiFormHospitalIntId').text(thisHosp.id);
			$('#wifiFormCb1').prop('checked',false)
			$('#wifiFormCb2').prop('checked',false)
			$('#wifiFormCb2_2').prop('checked',false)
			$('#wifiFormCb3').prop('checked',false)
			$('#wifiFormCb3_2').prop('checked',false)
			$('#patientcostform').show();
			$('#staffcostform').show();
			$('#allcostform').show();
			$('#wifiCost').val('');
			$('#wifiCost_2').val('');
			$('#OrigEditedByName').text('');
			$('#EditedByName').val('');
			$('#wifiComment').val('');
			var address='';;
			$('#wifiFormHospitalAddress').html(thisHosp.Address_line_1+'<br>'+thisHosp.Address_line_2+'<br>'+thisHosp.Address_line_3+'<br>'+thisHosp.Address_line_4+'<br>'+thisHosp.Address_line_5+'<br>'+thisHosp.PostCode);
			$('#wifiFormHealthACode').text(thisHosp.High_Level_Health_Authority_Code);
			$('#wifiFormContactName').text(thisHosp.contact_name);
			$('#wifiFormContactNo').text(thisHosp.contact_tel_no);
			if (thisHosp.wifi) {
				$('#wifiFormCb1').prop('checked',thisHosp.wifi.exists);
				$('#wifiFormCb2').prop('checked',thisHosp.wifi.open);
				if ((thisHosp.wifi.openStaff == undefined && thisHosp.wifi.open) || thisHosp.wifi.openStaff) {
					$('#wifiFormCb2_2').prop('checked',true);
					}
				var both=0;
				if (thisHosp.wifi.free) {
					$('#wifiFormCb3').prop('checked',true);
					$('#patientcostform').hide();
					both++;
				}
				if ((thisHosp.wifi.freeStaff == undefined && thisHosp.wifi.free) || thisHosp.wifi.freeStaff) {
					$('#wifiFormCb3_2').prop('checked',true);
					$('#staffcostform').hide();
					both++;
				}
				if (both == 2) $('#allcostform').hide();
				$('#wifiCost').val(thisHosp.wifi.cost);
				if (thisHosp.wifi.costStaff) $('#wifiCost_2').val(thisHosp.wifi.costStaff);
				$('#OrigEditedByName').text(thisHosp.wifi.editedBy);
				if (thisHosp.wifi.comment) $('#wifiComment').val(thisHosp.wifi.comment.replace(/\\u000a/g,'\n'));
			}
			if (thisHosp.Parking) {
				$('#parkFormTotal').text(thisHosp.Parking.Total_parking_spaces);
				$('#parkFormStaff').text(thisHosp.Parking.Designated_Staff_parking);
				$('#parkFormVisit').text(thisHosp.Parking.Designated_parking);
				$('#parkFormDisabled').text(thisHosp.Parking.Designated_disabled_parking);
				$('#parkFormVisitorCost').text(thisHosp.Parking.Average_hourly_fee);
				$('#parkFormStaffCost').text(thisHosp.Parking.Average_hourly_Staff_fee);
				$('#parkFormConc').text(thisHosp.Parking.Visitor_concession_scheme);
				$('#parkFormDisabledCost').text(thisHosp.Parking.disabled_parking_charge);
			}

			$('#addWifiForm').show();
			showDetail();
			//EWD.application.oneHospital={};
			//oneHospital={};
		});
		return;
	}

	//catch any uncaught messages
	console.log('unknown message '+JSON.stringify(messageObj));
};
