// @ts-ignore
let rt = 1000;
let reloadOk = true;
setTimeout(() => {
  // @ts-ignore
  reloadOk && location.reload();
}, rt);
// @ts-ignore
document?.getElementsByTagName('body')[0].addEventListener('keydown', (e) => {
  if (e.code.toLowerCase() === 'space') {
    reloadOk = false;
  }
});
