const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
matchWindowSize(canvas);

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Failed to get canvas context");
}

const state = {
  concentration: false,
  circles: [],
  t: 0,
};
for (let i = 0; i < 100; i++) {
  state.circles.push(circle(context));
}

function draw() {
  const { innerWidth: width, innerHeight: height } = window;
  context.fillStyle = "#fff3";
  context.fillRect(0, 0, width, height);

  context.save();

  context.translate(width / 2, height / 2);
  const size = Math.max(width, height) * 1.2;
  if (state.concentration) {
    state.t = Math.min(state.t + 0.01, 1);
  } else {
    state.t = Math.max(state.t - 0.01, 0);
  }

  state.circles.forEach((circle) => {
    circle.update(state);
    circle.draw(size);
  });
  context.restore();
  requestAnimationFrame(draw);
}

draw();

function circle(context) {
  const radius = Math.random() * 25 + 5;
  const base = {
    distance: Math.random(),
    radius,
    angleUpdate: Math.random() * 0.0003 * (12.5 / radius) + 0.0003,
  };
  const concentrated = {
    distance: base.distance * 0.45,
    radius: base.radius * 0.65,
    angleUpdate: base.angleUpdate * 20,
  };
  const color = `hsl(${Math.random() * 120 + 180}, 100%, 50%)`;
  const localState = {
    radius: base.radius,
    angleUpdate: base.angleUpdate,
    distance: base.distance,
    angle: Math.random() * 2 * Math.PI,
  };
  return {
    draw(size) {
      const { angle, radius, distance } = localState;
      const x = Math.cos(angle) * distance * size;
      const y = Math.sin(angle) * distance * size;
      context.beginPath();
      context.arc(x, y, radius, 0, 2 * Math.PI);
      context.fillStyle = color;
      context.fill();
    },
    update({ t }) {
      // targets
      localState.distance = lerp(
        base.distance,
        concentrated.distance,
        easeInOut(t)
      );
      localState.angleUpdate = lerp(
        base.angleUpdate,
        concentrated.angleUpdate,
        easeInOut(t)
      );
      localState.radius = lerp(base.radius, concentrated.radius, easeInOut(t));
      localState.angle += localState.angleUpdate;
    },
  };
}

window.addEventListener("resize", () => {
  matchWindowSize(canvas);
});

function matchWindowSize(canvas) {
  const { innerWidth, innerHeight } = window;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

document.addEventListener("request-start", () => {
  state.concentration = true;
});
document.addEventListener("request-end", () => {
  state.concentration = false;
});

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
