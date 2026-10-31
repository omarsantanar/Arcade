extends RefCounted
## Browser motion sensor adapter. A native touch click is available if Safari
## requires transient activation for DeviceMotionEvent.requestPermission().

func initialize() -> void:
	if not OS.has_feature("web"):
		return
	JavaScriptBridge.eval("""
(function () {
  if (window.__rdMotion) return;
  const m = {
    enabled: false, subscribed: false, ready: false, last: 0,
    source: "", angle: 0, center: 0, needsCenter: true,
    invert: false, status: "Sin activar", denied: false
  };
  let fallback = null;
  const nativeButton = document.createElement("button");
  nativeButton.type = "button";
  nativeButton.textContent = "PERMITIR SENSOR";
  nativeButton.setAttribute("aria-label", "Permitir movimiento del teléfono");
  nativeButton.style.cssText = "display:none;position:fixed;top:24%;left:50%;transform:translateX(-50%);z-index:9999;padding:13px 18px;border:2px solid #fff;border-radius:12px;background:#133a5c;color:#fff;font:700 16px system-ui;box-shadow:0 6px 22px #0006;cursor:pointer;touch-action:manipulation;";
  document.body.appendChild(nativeButton);
  function showButton(show) {
    nativeButton.style.display = show ? "block" : "none";
  }
  function deltaDegrees(a, b) {
    return ((a - b + 540) % 360) - 180;
  }
  function ingest(value, source) {
    if (!m.enabled || !Number.isFinite(value)) return;
    m.angle = value;
    m.last = Date.now();
    m.ready = true;
    m.source = source;
    if (m.needsCenter) {
      m.center = value;
      m.needsCenter = false;
    }
    m.status = "Leyendo movimiento (" + source + ")";
    showButton(false);
  }
  function onMotion(event) {
    if (!m.enabled) return;
    const a = event.accelerationIncludingGravity;
    if (!a || !Number.isFinite(a.x) || !Number.isFinite(a.y)) return;
    if (Math.hypot(a.x, a.y) < 2.5) return;
    // atan2(y,x) follows rotation of the phone's plane; calibration
    // removes landscape direction (90 / 270) and personal grip angle.
    ingest(Math.atan2(a.y, a.x) * 180 / Math.PI, "acelerómetro");
  }
  function onOrientation(event) {
    if (!m.enabled || (m.source === "acelerómetro" && Date.now() - m.last < 1600)) return;
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    const screenAngle = (window.screen && window.screen.orientation) ? window.screen.orientation.angle : (window.orientation || 0);
    const landscape = Math.abs(screenAngle) === 90 || Math.abs(screenAngle) === 270;
    ingest(landscape ? event.beta : event.gamma, "orientación");
  }
  function subscribe() {
    if (!m.subscribed) {
      window.addEventListener("devicemotion", onMotion, {passive: true});
      window.addEventListener("deviceorientation", onOrientation, {passive: true});
      m.subscribed = true;
    }
    m.enabled = true;
    m.needsCenter = true;
    m.ready = false;
    m.last = 0;
    m.source = "";
    m.status = "Esperando lecturas: incline el teléfono";
    showButton(true);
    if (fallback) clearTimeout(fallback);
    fallback = setTimeout(function () {
      if (!m.ready && m.enabled) {
        m.status = "No llegan datos del sensor; use botones";
        showButton(true);
      }
    }, 2300);
  }
  function activate() {
    if (!window.isSecureContext) {
      m.status = "Se necesita HTTPS";
      showButton(true);
      return;
    }
    m.denied = false;
    const requests = [];
    try {
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        requests.push(DeviceMotionEvent.requestPermission());
      }
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        requests.push(DeviceOrientationEvent.requestPermission());
      }
    } catch (_) {
      m.status = "Pulse PERMITIR SENSOR";
      showButton(true);
      return;
    }
    if (!requests.length) {
      subscribe();
      return;
    }
    m.status = "Solicitando permiso de movimiento";
    showButton(true);
    Promise.all(requests).then(function (results) {
      if (results.every(function (result) { return result === "granted"; })) {
        subscribe();
      } else {
        m.status = "Permiso denegado: revise ajustes";
        m.denied = true;
        showButton(false);
      }
    }).catch(function () {
      m.status = "Pulse PERMITIR SENSOR en pantalla";
      showButton(true);
    });
  }
  nativeButton.addEventListener("click", activate);
  m.activate = activate;
  m.calibrate = function () {
    m.needsCenter = true;
    m.status = "Calibrando posición neutra";
  };
  m.toggleInvert = function () {
    m.invert = !m.invert;
    return m.invert;
  };
  m.disable = function () {
    m.enabled = false;
    m.ready = false;
    m.status = "Dirección táctil";
    showButton(false);
  };
  m.snapshot = function () {
    const fresh = m.ready && Date.now() - m.last < 1600;
    if (m.enabled && m.ready && !fresh) m.status = "Sin lecturas recientes: use botones";
    const degrees = fresh ? deltaDegrees(m.angle, m.center) : 0;
    const steering = Math.max(-1, Math.min(1, degrees / 32)) * (m.invert ? -1 : 1);
    return JSON.stringify({
      ready: fresh && m.enabled,
      steer: steering,
      degrees: degrees,
      source: m.source,
      status: m.status,
      inverted: m.invert
    });
  };
  window.__rdMotion = m;
})();
""", true)

func activate() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__rdMotion && window.__rdMotion.activate();", true)

func disable() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__rdMotion && window.__rdMotion.disable();", true)

func calibrate() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__rdMotion && window.__rdMotion.calibrate();", true)

func invert() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__rdMotion && window.__rdMotion.toggleInvert();", true)

func read() -> Dictionary:
	if not OS.has_feature("web"):
		return {"ready": false, "steer": 0.0, "degrees": 0.0, "status": "No disponible en esta plataforma"}
	var raw: Variant = JavaScriptBridge.eval("window.__rdMotion ? window.__rdMotion.snapshot() : '{}'", true)
	if raw is String:
		var data: Variant = JSON.parse_string(raw)
		if data is Dictionary:
			return data
	return {"ready": false, "steer": 0.0, "degrees": 0.0, "status": "Error de comunicación con el sensor"}
