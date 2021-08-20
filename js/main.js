function resize_to_fit(element) {
	if (element.classList.contains("gauge-assembly")) {
		element.dataset.scalerate--;
		element.style.transform = "scale(" + element.dataset.scalerate + "%)";
		let gaugeNeedResize = false;
		if ((element.clientWidth * parseFloat(element.dataset.scalerate)) / 100 >= element.parentElement.clientWidth - 20) {
			gaugeNeedResize = true;
		}
		if ((element.clientHeight * parseFloat(element.dataset.scalerate)) / 100 >= element.parentElement.clientHeight - 20) {
			gaugeNeedResize = true;
		}
		if (gaugeNeedResize) resize_to_fit(element);
		return;
	}
	let fontSize = window.getComputedStyle(element).fontSize;
	element.style.fontSize = parseFloat(fontSize) - 1 + "px";
	hasIcon = element.querySelector(".icon");
	if (hasIcon) {
		hasIcon.style.width = parseFloat(fontSize) - 1 + "px";
		hasIcon.style.height = parseFloat(fontSize) - 1 + "px";
	}

	let needResize = false;
	if (element.clientWidth >= element.parentElement.clientWidth - 40) {
		needResize = true;
	}
	if (element.clientHeight >= element.parentElement.clientHeight - element.previousElementSibling.clientHeight - 20) {
		needResize = true;
	}
	if (needResize) {
		resize_to_fit(element);
	} else {
		// 让同一行字体一样大
		previousElement = element.parentElement.previousElementSibling;
		if (previousElement && previousElement.classList.contains("sync-fontsize")) {
			if (parseFloat(window.getComputedStyle(previousElement.querySelector(".content")).fontSize) < parseFloat(window.getComputedStyle(element).fontSize)) {
				element.style.fontSize = window.getComputedStyle(previousElement.querySelector(".content")).fontSize;
			} else {
				previousElement.querySelector(".content").style.fontSize = window.getComputedStyle(element).fontSize;
				hasIcon = previousElement.querySelector(".icon");
				if (hasIcon) {
					hasIcon.style.width = window.getComputedStyle(element).fontSize;
					hasIcon.style.height = window.getComputedStyle(element).fontSize;
				}
			}
		}
	}
}
window.addEventListener("resize", () => {
	for (item of document.querySelectorAll(".grid-item .content")) {
		item.style.fontSize = "500px";
		resize_to_fit(item);
	}
	document.querySelector(".gauge-assembly").dataset.scalerate = 200;
	resize_to_fit(document.querySelector(".gauge-assembly"));
});
setTimeout(() => {
	for (item of document.querySelectorAll(".grid-item .content")) {
		item.style.fontSize = "500px";
		resize_to_fit(item);
	}
	document.querySelector(".gauge-assembly").dataset.scalerate = 200;
	resize_to_fit(document.querySelector(".gauge-assembly"));
}, 500);

setInterval(() => {
	let myDate = new Date();
	var days = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六");
	document.querySelector(".time .weak").innerHTML = days[myDate.getDay()];
	splitter = parseInt(myDate.getTime() / 1000) % 2 ? "<span style='opacity:0'>:</span>" : ":";
	document.querySelector(".time .strong").innerHTML = myDate.getHours() + splitter + String(myDate.getMinutes()).padStart(2, "0");
	updateSeneorData();
}, 1000);

function changeGauge(speed) {
	let currentScale;
	if (speed < 100) {
		currentScale = [0, 1, 5, 10, 20, 30, 50, 75, 100];
	} else if (speed < 250) {
		currentScale = [0, 10, 25, 50, 75, 100, 150, 200, 250];
	} else {
		currentScale = [0, 10, 50, 100, 200, 300, 500, 750, 1000];
	}
	document.querySelectorAll(".increments-wrapper span.increment").forEach((increment, index) => {
		increment.innerHTML = currentScale[index];
		if (currentScale[index] == 1000) {
			increment.innerHTML = "1g";
		}
	});
	document.querySelector(".number.monochrome-primary span").innerHTML = speed;

	// 33.75°为一格
	let targetDegree = 0;
	let targetPixel = 404;
	for (let [index, increment] of currentScale.entries()) {
		if (speed > increment) {
			targetDegree += increment == 0 ? 45 : 33.75;
			targetPixel -= increment == 0 ? 0 : 25.3125;
			document.querySelectorAll(".increments-wrapper span.increment")[index].classList.remove("increment--off");
			document.querySelectorAll(".increments-wrapper span.increment")[index].classList.add("increment--on");
		} else if (speed == 0) {
			targetDegree += 45;
		} else {
			targetDegree += ((speed - currentScale[index - 1]) / (increment - currentScale[index - 1])) * 33.75;
			targetPixel -= ((speed - currentScale[index - 1]) / (increment - currentScale[index - 1])) * 25.3125;
			//console.log(speed, "小于", increment, "+" + ((speed - currentScale[index - 1]) / (increment - currentScale[index - 1])) * 33.75);
			document.querySelectorAll(".increments-wrapper span.increment").forEach((element, elementIndex) => {
				if (elementIndex >= index) {
					element.classList.remove("increment--on");
					element.classList.add("increment--off");
				}
			});

			break;
		}
	}
	document.querySelector(".gauge-path-current-speed ").setAttribute("stroke-dashoffset", targetPixel + "px");
	document.querySelector(".gauge-needle").style.transform = "translate3d(-50%, -44%, 0px) rotateZ(" + targetDegree + "deg)";
}
function updateSeneorData() {
	fetch("http://192.168.42.130:55555/")
		.then((d) => d.json())
		.then((sensorData) => {
			let sensorDataObject = {};
			for (item of sensorData) {
				sensorDataObject[item.SensorName] = item.SensorValue;
			}
			CPUUtilization.innerHTML = sensorDataObject["CPU Utilization (SCPUUTI)"] + "%";
			GPUUtilization.innerHTML = sensorDataObject["GPU Utilization (SGPU1UTI)"] + "%";
			CPUTemp.innerHTML = sensorDataObject["CPU (TCPU)"];
			GPUTemp.innerHTML = sensorDataObject["GPU Diode (TGPU1DIO)"];
			MemoryUsage.innerHTML =
				(parseFloat(sensorDataObject["Used Memory (SUSEDMEM)"]) / 1024).toFixed(1) +
				"/" +
				((parseFloat(sensorDataObject["Used Memory (SUSEDMEM)"]) + parseFloat(sensorDataObject["Free Memory (SFREEMEM)"])) / 1024).toFixed(1) +
				" GB";
			FanSpeed.innerHTML = sensorDataObject["CPU (FCPU)"] + " RPM";
			changeGauge((parseFloat(sensorDataObject["NIC3 Download Rate (SNIC3DLRATE)"]) / 125).toFixed(1)); // 这指针会顺时针扭到0，得想办法修一修
		});
}
