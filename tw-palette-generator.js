const init = () => {
  const colorPickerEl = document.getElementById("color-picker");
  const colorPickerLabelEl = document.getElementById("color-picker-label");

  const generator = new Generator();

  const setColorToLabel = (value) => (colorPickerLabelEl.style.color = value);
  const watchColorPicker = (event, value) => {
    setColorToLabel(event?.target?.value);
    generator.onInputHexcode(colorPickerEl.value);
  };

  colorPickerEl.addEventListener("input", watchColorPicker, false);
  colorPickerEl.addEventListener("change", watchColorPicker, false);

  setColorToLabel(colorPickerEl.value);
  generator.onInputHexcode(colorPickerEl.value);
};

const processColor = (e, t) => {
  t.forEach((r) => {
    r.shades = r.shades.map((o) => ({
      ...o,
      delta: chroma.deltaE(e, o.hexcode),
    }));
  });
  t.forEach((r) => {
    r.closestShade = r.shades.reduce((o, a) => (o.delta < a.delta ? o : a));
  });
  let n = t.reduce((r, o) =>
    r.closestShade.delta < o.closestShade.delta ? r : o
  );
  return (
    (n.shades = n.shades.map((r) => ({
      ...r,
      lightnessDiff: Math.abs(
        chroma(r.hexcode).get("hsl.l") - chroma(e).get("hsl.l")
      ),
    }))),
    (n.closestShadeLightness = n.shades.reduce((r, o) =>
      r.lightnessDiff < o.lightnessDiff ? r : o
    )),
    n
  );
};

class Generator {
  constructor(hexcode) {}
  onInputHexcode(hexcode) {
    this.inputs = { hexcode: hexcode, hsl: {}, oklch: {} };
    this.setHslFromHexcode();
    this.setOklchFromHexcode();
    this.updateColorScale();
  }
  setHslFromHexcode() {
    (this.inputs.hsl.hue = Math.round(
      chroma(this.inputs.hexcode).get("hsl.h")
    )),
      (this.inputs.hsl.saturation = Math.round(
        chroma(this.inputs.hexcode).get("hsl.s") * 100
      )),
      (this.inputs.hsl.lightness = Math.round(
        chroma(this.inputs.hexcode).get("hsl.l") * 100
      ));
  }
  setOklchFromHexcode() {
    (this.inputs.oklch.lightness = Math.round(
      chroma(this.inputs.hexcode).get("oklch.l") * 100
    )),
      (this.inputs.oklch.chroma = chroma(this.inputs.hexcode)
        .get("oklch.c")
        .toFixed(2)),
      (this.inputs.oklch.hue = Math.round(
        chroma(this.inputs.hexcode).get("oklch.h")
      ));
  }
  updateColorScale() {
    this.colorScale = this.generatePalette(this.inputs.hexcode);
    console.log(this.colorScale);
    this.inputs.hexcode.length == 6 &&
      (this.inputs.hexcode = chroma(this.inputs.hexcode).hex());

    this.updateUi(this.colorScale);
  }

  updateUi(colorScale) {
    const outputEl = document.getElementById("result-palette");
    outputEl.innerHTML = "";

    colorScale.shades.forEach(({ number, hexcode, hsl, oklch }) => {
      const colorBox = document.createElement("div");
      colorBox.classList.add("color-box");
      colorBox.innerText = number + " : " + hexcode.toUpperCase();
      colorBox.style.backgroundColor = hexcode.toUpperCase();
      outputEl.append(colorBox);
    });
  }

  generatePalette(e) {
    const t = window.TwColorPalette.filter(
        (u) =>
          u.name !== "Slate" &&
          u.name !== "Gray" &&
          u.name !== "Zinc" &&
          u.name !== "Neutral" &&
          u.name !== "Stone"
      ),
      n = processColor(e, t);
    let r = chroma(e).get("hsl.h"),
      o = chroma(n.closestShadeLightness.hexcode).get("hsl.h"),
      a = r - (o || 0),
      i =
        chroma(e).get("hsl.s") /
        chroma(n.closestShadeLightness.hexcode).get("hsl.s");
    a == 0 ? (a = o.toString()) : a > 0 ? (a = "+" + a) : (a = a.toString());
    let l = {};
    return (
      (l.id = "id-" + Date.now().toString()),
      (l.name = "name-" + Date.now().toString()),
      (l.shades = n.shades.map((u) => {
        let f = u.hexcode,
          m = chroma(f).get("hsl.s") * i;
        return (
          (f = chroma(f).set("hsl.s", m).hex()),
          (f = chroma(f).set("hsl.h", a).hex()),
          n.closestShadeLightness.number == u.number && (f = chroma(e).hex()),
          {
            number: u.number.toString(),
            hexcode: f,
            hsl: {
              hue: Math.round(chroma(f).get("hsl.h")) || 0,
              saturation: Math.round(chroma(f).get("hsl.s") * 100),
              lightness: Math.round(chroma(f).get("hsl.l") * 100),
            },
            oklch: {
              lightness: Math.round(chroma(f).get("oklch.l") * 100),
              chroma: Number(chroma(f).get("oklch.c") * 100).toFixed(1),
              hue: Math.round(chroma(f).get("oklch.h")) || 0,
            },
            isLocked: n.closestShadeLightness.number == u.number,
          }
        );
      })),
      l
    );
  }
}

document.addEventListener("DOMContentLoaded", init, false);
