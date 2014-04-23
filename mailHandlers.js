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

var nodeMailer = require('nodemailer');

var hospMail = {
	initialised: false,
	initialise: function(ewd) {
		if (!hospMail.initialised) {
			//ewd.log('********** mailhandler module initialising ********************',1);
			var zewdMail = new ewd.mumps.GlobalNode('zewd',['appControlParams', 'aboutmyhospital', 'nodeMailer']);
			var ewdMail=zewdMail._getDocument();
			if (typeof ewdMail.username !== 'undefined' && ewdMail.username !== '') {
				hospMail.smtpTransport = nodeMailer.createTransport("SMTP", {
					service: "Gmail",
					auth: {
						user: ewdMail.username,
						pass: ewdMail.password
						}
					});
				hospMail.initialised = true;
				return true;
			}
			else {
				return false;
				}
		}
		else { return true;}
	}
};
//SMTP handlers
module.exports = {
	onSocketMessage: function(ewd) {
		var wsMsg = ewd.webSocketMessage;
		var type = wsMsg.type;
		var params = wsMsg.params;
		if (type === 'sendEmail') {
			//ewd.log("** mailhandler module handling message: " + JSON.stringify(ewd.webSocketMessage),1);
			if (!hospMail.initialise(ewd)){
				ewd.log("** mail initialisation failure with message: " + JSON.stringify(ewd.webSocketMessage),1);
				ewd.sendWebSocketMsg({type: 'emailInitError', message: {text: 'email failed to initialise'}});
				return false;
			};
			var mailOptions = {
				from: 'aboutmyhospital@gmail.com',
				to: params.to,
				subject: params.subject,
				text: params.text
			};
			//ewd.log("** mailhandler module handling message: " + JSON.stringify(hospMail),1);
			hospMail.smtpTransport.sendMail(mailOptions,function(error, response) {
				if (error) {
					ewd.sendWebSocketMsg({
						  type: 'emailSendError',
						  message: {
							text: error
						  }
						});
					}
				else {
					ewd.sendWebSocketMsg({
					  type: 'emailMessageSent',
					  message: {
						text: response.message
					  }
					});
				}
			})
		  return true;
		}
		return false;
	}
};
