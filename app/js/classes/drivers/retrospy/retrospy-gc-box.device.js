const Clone = require('clone');

/*
	RetroSpyDevice_GC
	Parses the input from a gamecube controller and parses it into an chromium gamepad response.

	Original implementation:
	Original NintendoSpy implementation by Jeremy Burns (jaburns). https://github.com/jaburns/NintendoSpy
	RetroSpy fork by Christopher J. Mallery (zoggins). https://github.com/zoggins/RetroSpy

	RetroSpy Copyright 2018 Christopher J. Mallery <http://www.zoggins.net> NintendoSpy Copyright (c) 2014 Jeremy Burns
	LICENSE: https://github.com/zoggins/RetroSpy/blob/master/LICENSE
	
	Open Joystick Display implementation:
	Port by Anthony 'Dragoni' Mattera (RetroWeeb) https://github.com/RetroWeeb
	Copyright 2019 Open Joystick Display Project, Anthony 'Dragoni' Mattera (RetroWeeb)
	LICENSE: https://ojdproject.com/license
	
*/
class RetroSpyDevice_GC_Box {

	constructor(profile) {

		this.buttonMap 			= [2, 3 ,4, 5, 6, 8, 9, 10, 11, 12, 13, 14];
		this.axisMap 			= [0, 8, 16, 24, 32, 40];
		this.axisBase			= 128

		// For some reason y axis are inverted in value. I could update the arduino firmware, but to remain compatible with zoggins work...
		this.axisMapInverted	= [false, true, false, true, false, false]; 
		this.axisMapOffset 		= 15;
		this.axisMapByteLength 	= 8;
		this.buttonOn  = {pressed:true, value:1};
		this.buttonOff = {pressed:false, value:0};

		this.resetJoystick();
		this.joystickInfo = "RetroSpy Ardunio Nintendo Gamecube. 12 Buttons, 6 Axes";
	}

	resetJoystick() {
		// Emulates Chromium Gamepad Model
		this.joystick = Clone({
			axes:[0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			buttons: [
				this.buttonOff,
				this.buttonOff,
				this.buttonOff,
				this.buttonOff,
				this.buttonOff,
				this.buttonOff,
				this.buttonOff,
				this.buttonOff,
				this.buttonOff,
				this.buttonOff,
				this.buttonOff,
				this.buttonOff
			]
		});
	}

	getJoystick() {
		return this.joystick;
	}

	getInformation() {
		return this.joystickInfo;
	}

	readAxis(subLine, inverted) {
		let axisValue  = subLine.replace(/\0/g, 0); // Convert to Binary
		axisValue = parseInt(axisValue, 2); // Convert to Base 10

		if (isNaN(axisValue)) {
			return 0.0;
		}

		axisValue = parseFloat(axisValue)
		
		axisValue = (axisValue - this.axisBase ) / this.axisBase; // Get Value
		
		if (!axisValue)
		{
			return 0.0;
		}
		
		if (inverted) {
			axisValue = axisValue *-1;
		}
		
		return axisValue;
	}

	read(line) {
		const buffer = [...line];
		let bufferIndex;

		// Read Buttons
		for (const buttonIndex in this.buttonMap) {
			bufferIndex = this.buttonMap[buttonIndex];
			if (buffer[bufferIndex] === '1') {
				this.joystick.buttons[buttonIndex] = this.buttonOn;
			} 
		}
		

		// Read Axis
		const axisBuffer = buffer.slice();
		let subLine;
		for (const axisIndex in this.axisMap) {
			bufferIndex = this.axisMap[axisIndex];
			subLine = axisBuffer.slice(	bufferIndex + this.axisMapOffset, 
										bufferIndex+this.axisMapOffset + this.axisMapByteLength
										).join("");
			const value = this.readAxis(subLine, this.axisMapInverted[axisIndex]);
			
			if (!value) {
				continue;
			}
			this.joystick.axes[axisIndex] = value;
		}
	}

}

module.exports.RetroSpyDevice_GC_Box = RetroSpyDevice_GC_Box;