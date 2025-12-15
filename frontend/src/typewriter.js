export function typewriter(element, text, charDelay = 30) {
  if (!element) return null;
  element.textContent = "";
  let i = 0;
  const id = setInterval(() => {
    element.textContent += text.charAt(i++);
    if (i >= text.length) {
      clearInterval(id);
    }
  }, charDelay);
  return id;
}


