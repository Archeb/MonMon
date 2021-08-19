function resize_to_fit(element) {
	let fontSize = window.getComputedStyle(element).fontSize;
	element.style.fontSize = parseFloat(fontSize) - 1 + "px";

	let needResize = false;
	if (element.clientWidth >= element.parentElement.clientWidth - 40) {
		needResize = true;
	}
	if (element.clientHeight >= element.parentElement.clientHeight - element.previousElementSibling.clientHeight - 20) {
		needResize = true;
	}
	if (needResize) {
		resize_to_fit(element);
	}
}
window.addEventListener("resize", () => {
	for (item of document.querySelectorAll(".grid-item .content")) {
		item.style.fontSize = "500px";
		resize_to_fit(item);
	}
});
setTimeout(() => {
	for (item of document.querySelectorAll(".grid-item .content")) {
		item.style.fontSize = "500px";
		resize_to_fit(item);
	}
}, 500);
