var titles = [".NET", "Java", "JavaScript", "Python"];

function changeTab(index) {
  var boxes = document.getElementsByClassName('box');
  for (var i = 0; i < boxes.length; i++) {
    if (i === index) {
      boxes[i].classList.remove('hidden');
    } else {
      boxes[i].classList.add('hidden');
    }
  }
  document.getElementById('content').classList.remove('grid');
}

function showAll() {
  var boxes = document.getElementsByClassName('box');
  for (var i = 0; i < boxes.length; i++) {
    boxes[i].classList.remove('hidden');
  }
  document.getElementById('content').classList.add('grid');
}

async function submit() {
  console.log('submit');

  const input = document.getElementById('input').value;
  const model = document.getElementById('model').value;
  
  const errorDiv = document.getElementById('error');
  const response = await fetch(`http://localhost:5000/api/v1/codegen?model=${model}`, { body: JSON.stringify({ input: input }), method: 'POST', headers: { 'Content-Type': 'application/json' } });

  if(response.ok){
    let { answer } = await response.json();
    console.log(answer);
    answer = answer.replace(/```javascript([^`]*)```/g, function(match, p1) {
      return '<br><pre><code class="language-javascript">' + Prism.highlight(p1, Prism.languages.javascript, 'javascript') + '</code></pre><br>';
    });

    const boxes = document.getElementsByClassName('box');
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].innerHTML = answer;
      document.getElementById(`tabButton${i}`).textContent = titles[i];
    }
    errorDiv.style.display = 'none'; // hide the error message    
  } else {
    const error = await response.json();
    errorDiv.textContent = 'An error occurred: ' + error.message;
    errorDiv.style.display = 'block'; // show the error message
  }
}