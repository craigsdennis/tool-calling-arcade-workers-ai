async function callAPI() {
	const model = document.getElementById("modelSelect").value;
	const message = document.getElementById("messageInput").value;
	const toolsJSON = editor.getValue();

	try {
	  const response = await fetch("/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ model, message, toolsJSON })
	  });
	  const data = await response.json();
	  console.log(data);
	  document.getElementById("outputBox").textContent = `Response: ${data.responseMessage}\nTool Call Example: ${JSON.stringify(data.toolCalls, null, 2)}`;
	} catch (error) {
	  document.getElementById("outputBox").textContent = "Error calling API: " + error.message;
	}
  }

  async function loadSamples() {
	try {
	  const response = await fetch("/api/samples");
	  const samples = await response.json();
	  const sampleList = document.getElementById("sampleList");
	  sampleList.innerHTML = "";
	  samples.forEach(sample => {
		const li = document.createElement("li");
		li.textContent = sample.title;
		li.onclick = () => loadSample(sample);
		sampleList.appendChild(li);
	  });
	} catch (error) {
	  document.getElementById("sampleList").innerHTML = "Failed to load samples.";
	}
  }

  function loadSample(sample) {
	editor.setValue(sample.toolsJSON);
	document.getElementById("messageInput").value = sample.message;
  }

  const editor = CodeMirror.fromTextArea(document.getElementById("toolDefInput"), {
	mode: "application/json",
	theme: "eclipse",
	lineNumbers: true,
	matchBrackets: true,
	autoCloseBrackets: true
  });

  editor.on("change", () => {
	try {
	  JSON.parse(editor.getValue());
	  document.getElementById("errorMessage").textContent = "";
	} catch (error) {
	  document.getElementById("errorMessage").textContent = "Invalid JSON: " + error.message;
	}
  });

  loadSamples();
