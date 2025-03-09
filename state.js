
export const mycanvas = document.getElementById("myCanvas");
export const helperCanvas = document.getElementById("helperCanvas");
export const ctx = mycanvas.getContext("2d");
export const helperCtx = helperCanvas.getContext("2d");

const SHOW_HELPER_REGIONS = false;
if (!SHOW_HELPER_REGIONS) {
  helperCanvas.style.display = "none";
}

export const CURSOR_SIZE = 8;
export let shapes=[];

export const state = {
    cursorX: null,
    cursorY: null,
    prevCursorX: null,
    prevCursorY: null,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    canvasProperties: {
      width:  window.innerWidth,
      height: window.innerHeight,
      center: {
        x:  window.innerWidth/2,
        y: window.innerHeight / 2,
      },
    },
  };
  