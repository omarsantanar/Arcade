extends Node3D
## Conducción RD: prototipo educativo, no examen oficial del INTRANT.
const MAX_TIME := 300.0
const LIMIT_KMH := 30.0
const STOP_Z := -12.0
const GOAL_Z := -57.0
const MotionAdapterScript = preload("res://scripts/sensor_bridge.gd")

var car: Node3D
var steering: Node3D
var camera: Camera3D
var npc: Node3D
var lights: Array[MeshInstance3D] = []
var state := "ROJO"
var clock := 0.0
var left_time := MAX_TIME
var speed := 0.0
var direction := 0.0
var gear := "D"
var playing := false
var finished := false
var left_held := false
var right_held := false
var gas_held := false
var brake_held := false
var tilt_enabled := false
var tilt_center := 0.0
var tilt_value := 0.0
var tilt_inverted := false
var motion_adapter = MotionAdapterScript.new()
var sensor_status := "Sensor sin activar"
var previous_nose := 0.0

var hud: Control
var speed_label: Label
var time_label: Label
var gear_label: Label
var info_label: Label
var sensor_label: Label
var start_overlay: ColorRect
var end_overlay: ColorRect
var end_title: Label
var end_detail: Label
var buttons: Array[Button] = []
var intro_panel: Panel
var result_panel: Panel

func _ready() -> void:
	motion_adapter.initialize()
	_build_world()
	_build_car()
	_build_ui()
	_reset()
	get_viewport().size_changed.connect(_layout)
	_layout()

func _process(delta: float) -> void:
	if playing:
		clock += delta
		left_time -= delta
		_update_signal()
		if state == "ROJO":
			npc.position.x += 4.0 * delta
			if npc.position.x > 22.0:
				npc.position.x = -35.0
		else:
			npc.position.x = -35.0
		if left_time <= 0.0:
			_fail("TIEMPO AGOTADO", "No llegó a la meta en cinco minutos.")
	speed_label.text = "%02d km/h   |   Máximo 30 km/h" % int(absf(speed) * 3.6)
	time_label.text = "Tiempo %02d:%02d" % [int(maxf(left_time,0.0) / 60), int(maxf(left_time,0.0)) % 60]
	gear_label.text = "Marcha: " + gear
	if tilt_enabled:
		sensor_label.text = "Dirección móvil: " + sensor_status
	else:
		sensor_label.text = "Móvil: pulse INCLINAR, permita el sensor y calibre"

func _physics_process(delta: float) -> void:
	if not playing:
		return
	var accelerating := gas_held or Input.is_key_pressed(KEY_UP)
	var braking := brake_held or Input.is_key_pressed(KEY_DOWN) or Input.is_key_pressed(KEY_SPACE)
	var lr := float(int(right_held or Input.is_key_pressed(KEY_RIGHT)) - int(left_held or Input.is_key_pressed(KEY_LEFT)))
	if tilt_enabled:
		if OS.has_feature("web"):
			var sample: Dictionary = motion_adapter.read()
			sensor_status = str(sample.get("status", "Esperando movimiento"))
			if bool(sample.get("ready", false)):
				var measured: float = float(sample.get("steer", 0.0))
				tilt_value = lerpf(tilt_value, measured, minf(delta * 9.0, 1.0))
				if not (left_held or right_held or Input.is_key_pressed(KEY_LEFT) or Input.is_key_pressed(KEY_RIGHT)):
					lr = tilt_value
			else:
				tilt_value = move_toward(tilt_value, 0.0, 3.0 * delta)
		else:
			var g := Input.get_gravity()
			if g.length() > 0.5:
				var sign_dir := -1.0 if tilt_inverted else 1.0
				tilt_value = lerpf(tilt_value, clampf((g.x - tilt_center) / 5.0, -1.0, 1.0) * sign_dir, minf(delta * 7.0, 1.0))
				lr = tilt_value
	direction = move_toward(direction, lr, delta * 3.0)
	if braking or gear == "P":
		speed = move_toward(speed, 0.0, 10.0 * delta)
	elif accelerating:
		speed = move_toward(speed, 12.0 if gear == "D" else -3.0, 2.7 * delta)
	else:
		speed = move_toward(speed, 0.0, 0.9 * delta)
	if absf(speed) > 0.12:
		car.rotation.y -= direction * speed * 0.083 * delta
	car.position += -car.global_transform.basis.z * speed * delta
	steering.rotation.z = direction * 0.45
	var nose := (car.global_transform * Vector3(0, 0, -2.0)).z
	if previous_nose >= STOP_Z and nose < STOP_Z and state == "ROJO":
		_fail("SEMÁFORO EN ROJO", "Cruzó la línea de detención con la luz roja.")
		return
	previous_nose = nose
	if absf(speed) * 3.6 > LIMIT_KMH + 0.8:
		_fail("EXCESO DE VELOCIDAD", "Superó el límite señalizado de 30 km/h.")
		return
	if absf(car.position.x) > 7.0 and absf(car.position.z + 20.0) > 7.5:
		_fail("SALIDA DE CALZADA", "El vehículo abandonó la calzada.")
		return
	if absf(car.position.z + 20.0) < 2.8 and absf(car.position.x - npc.position.x) < 2.5 and absf(speed) > 0.7:
		_fail("COLISIÓN", "Impactó con un vehículo que cruzaba la intersección.")
		return
	if car.position.z < GOAL_Z and car.position.x > 0.0 and car.position.x < 6.7:
		_end(true, "PRUEBA COMPLETADA", "Llegó a la meta sin infracciones detectadas por este prototipo.")

func _unhandled_key_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	if event.keycode == KEY_D:
		_set_gear("D")
	elif event.keycode == KEY_R:
		_set_gear("R")
	elif event.keycode == KEY_P:
		_set_gear("P")
	elif event.keycode == KEY_T:
		_toggle_tilt()
	elif event.keycode == KEY_C:
		_calibrate()
	elif event.keycode == KEY_ENTER and not playing:
		_start()

func _reset() -> void:
	playing = false
	finished = false
	clock = 0.0
	left_time = MAX_TIME
	speed = 0.0
	direction = 0.0
	gear = "D"
	left_held = false
	right_held = false
	gas_held = false
	brake_held = false
	car.position = Vector3(2.65, 0.06, 49.0)
	car.rotation = Vector3.ZERO
	previous_nose = (car.global_transform * Vector3(0, 0, -2.0)).z
	npc.position = Vector3(-35, 0.3, -20)
	_update_signal()

func _start() -> void:
	_reset()
	playing = true
	start_overlay.visible = false
	end_overlay.visible = false
	info_label.text = "Destino: siga hasta la línea verde de META."

func _fail(cause: String, detail: String) -> void:
	_end(false, cause, detail)

func _end(success: bool, cause: String, detail: String) -> void:
	if finished:
		return
	finished = true
	playing = false
	speed = 0.0
	end_title.text = ("APROBADO — " if success else "PRUEBA REPROBADA — ") + cause
	end_title.add_theme_color_override("font_color", Color("79f1b8") if success else Color("ff7782"))
	end_detail.text = detail + "\nTiempo de conducción: %02d:%02d" % [int((MAX_TIME - left_time) / 60), int(MAX_TIME - left_time) % 60]
	end_overlay.visible = true

func _set_gear(value: String) -> void:
	if not playing:
		return
	if absf(speed) > 0.4:
		info_label.text = "Deténgase antes de cambiar de marcha."
		return
	gear = value
	info_label.text = "Selector automático: " + gear

func _toggle_tilt() -> void:
	tilt_enabled = not tilt_enabled
	tilt_value = 0.0
	if tilt_enabled:
		if OS.has_feature("web"):
			motion_adapter.activate()
			sensor_status = "Solicitando acceso al sensor"
			info_label.text = "Permita el movimiento del móvil y sosténgalo en horizontal."
		else:
			_calibrate()
	else:
		if OS.has_feature("web"):
			motion_adapter.disable()
		info_label.text = "Dirección por botones o flechas."

func _calibrate() -> void:
	if not tilt_enabled:
		info_label.text = "Primero pulse INCLINAR para activar el movimiento."
		return
	tilt_value = 0.0
	if OS.has_feature("web"):
		motion_adapter.calibrate()
		info_label.text = "Mantenga el teléfono en posición neutral un instante."
		return
	var g := Input.get_gravity()
	if g.length() < 0.5:
		tilt_enabled = false
		info_label.text = "Sensor no disponible; utilice los botones."
		return
	tilt_center = g.x
	info_label.text = "Inclinación calibrada."

func _invert_tilt() -> void:
	if OS.has_feature("web"):
		motion_adapter.invert()
	else:
		tilt_inverted = not tilt_inverted
	info_label.text = "Sentido del volante invertido. Pruebe inclinarlo."

func _box(parent: Node3D, pos: Vector3, dimensions: Vector3, color: Color) -> MeshInstance3D:
	var item := MeshInstance3D.new()
	var cube := BoxMesh.new()
	cube.size = dimensions
	item.mesh = cube
	item.position = pos
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	item.material_override = material
	parent.add_child(item)
	return item

func _build_world() -> void:
	var env := WorldEnvironment.new()
	var sky := Environment.new()
	sky.background_mode = Environment.BG_COLOR
	sky.background_color = Color("a7bfd4")
	sky.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	sky.ambient_light_color = Color("cad9e8")
	env.environment = sky
	add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, -27, 0)
	add_child(sun)
	_box(self, Vector3(0, -0.2, 0), Vector3(210, 0.2, 210), Color("55715d"))
	_box(self, Vector3(0, -0.05, 0), Vector3(14, 0.13, 170), Color("39414b"))
	_box(self, Vector3(0, -0.045, -20), Vector3(130, 0.13, 14), Color("39414b"))
	for i in range(-10, 11):
		var z := float(i) * 8.0
		if absf(z + 20.0) > 8.0:
			_box(self, Vector3(0, 0.035, z), Vector3(0.18, 0.03, 4), Color("e2c868"))
			_box(self, Vector3(6.8, 0.03, z), Vector3(0.12, 0.02, 4), Color.WHITE)
	for side in [-1.0, 1.0]:
		for i in range(10):
			var z := float(i) * 13.0 - 69.0
			if absf(z + 20.0) < 12.0:
				continue
			var height := 5.0 + float(i % 4) * 1.5
			_box(self, Vector3(side * 17, height * 0.5, z), Vector3(12.0, height, 10.0), Color("b7aaa1"))
	_box(self, Vector3(3.4, 0.055, STOP_Z), Vector3(6.2, 0.03, 0.37), Color("fff7ec"))
	for i in range(5):
		_box(self, Vector3(3.3, 0.06, -13.1 - float(i) * 0.9), Vector3(5.7, 0.03, 0.42), Color("e9eced"))
	_box(self, Vector3(3.3, 0.06, GOAL_Z), Vector3(6.3, 0.04, 0.7), Color("37d7a3"))
	_box(self, Vector3(8.0, 2.55, -12.7), Vector3(0.2, 5.1, 0.2), Color("505861"))
	_box(self, Vector3(6.05, 4.25, -12.7), Vector3(0.9, 2.0, 0.48), Color("222a32"))
	for i in range(3):
		var bulb := MeshInstance3D.new()
		var sphere := SphereMesh.new()
		sphere.radius = 0.27
		sphere.height = 0.54
		bulb.mesh = sphere
		bulb.position = Vector3(6.05, 4.85 - float(i) * 0.6, -12.39)
		bulb.material_override = StandardMaterial3D.new()
		add_child(bulb)
		lights.append(bulb)
	npc = Node3D.new()
	add_child(npc)
	_box(npc, Vector3.ZERO, Vector3(3.6, 0.9, 1.7), Color("dfbb69"))
	_box(npc, Vector3(0, 0.75, 0), Vector3(1.8, 0.65, 1.5), Color("58748b"))

func _update_signal() -> void:
	var t := fmod(clock, 29.0)
	state = "ROJO" if t < 12.0 else ("VERDE" if t < 25.0 else "AMARILLO")
	var colors := [Color("ff4258"), Color("ffce43"), Color("40e89a")]
	var names := ["ROJO", "AMARILLO", "VERDE"]
	for i in range(3):
		var material := lights[i].material_override as StandardMaterial3D
		material.albedo_color = colors[i] if state == names[i] else colors[i].darkened(0.85)
		material.emission_enabled = state == names[i]
		if material.emission_enabled:
			material.emission = colors[i]

func _build_car() -> void:
	car = Node3D.new()
	add_child(car)
	_box(car, Vector3(0, 0.55, -0.55), Vector3(1.75, 0.7, 3.75), Color("9baab4"))
	_box(car, Vector3(0, 1.00, -0.65), Vector3(1.8, 0.27, 0.55), Color("25303b"))
	_box(car, Vector3(-0.9, 1.5, -0.8), Vector3(0.14, 1.1, 0.17), Color("36434b"))
	_box(car, Vector3(0.9, 1.5, -0.8), Vector3(0.14, 1.1, 0.17), Color("36434b"))
	steering = Node3D.new()
	steering.position = Vector3(-0.45, 1.14, -0.2)
	car.add_child(steering)
	_box(steering, Vector3.ZERO, Vector3(0.56, 0.07, 0.07), Color("111722"))
	_box(steering, Vector3.ZERO, Vector3(0.07, 0.56, 0.07), Color("111722"))
	camera = Camera3D.new()
	camera.position = Vector3(-0.47, 1.5, 0.53)
	camera.fov = 83.0
	camera.current = true
	car.add_child(camera)

func _label(parent: Control, content: String, size: int, pos: Vector2, dimensions: Vector2) -> Label:
	var result := Label.new()
	result.text = content
	result.add_theme_font_size_override("font_size", size)
	result.position = pos
	result.size = dimensions
	result.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	parent.add_child(result)
	return result

func _button(parent: Control, caption: String, pos: Vector2, dimensions: Vector2, action: Callable) -> Button:
	var result := Button.new()
	result.text = caption
	result.position = pos
	result.size = dimensions
	result.focus_mode = Control.FOCUS_NONE
	parent.add_child(result)
	result.pressed.connect(action)
	return result

func _hold(parent: Control, caption: String, key: String) -> Button:
	var result := Button.new()
	result.text = caption
	result.focus_mode = Control.FOCUS_NONE
	parent.add_child(result)
	result.button_down.connect(func() -> void: set(key, true))
	result.button_up.connect(func() -> void: set(key, false))
	buttons.append(result)
	return result

func _overlay(layer: CanvasLayer) -> ColorRect:
	var rect := ColorRect.new()
	rect.color = Color(0.03, 0.06, 0.11, 0.90)
	rect.mouse_filter = Control.MOUSE_FILTER_STOP
	layer.add_child(rect)
	return rect

func _dialog(rect: ColorRect) -> Panel:
	var panel := Panel.new()
	rect.add_child(panel)
	return panel

func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	hud = Control.new()
	layer.add_child(hud)
	var panel := Panel.new()
	panel.name = "HUDTop"
	panel.position = Vector2(12, 12)
	hud.add_child(panel)
	speed_label = _label(panel, "", 24, Vector2(15, 6), Vector2(310, 38))
	gear_label = _label(panel, "", 20, Vector2(15, 45), Vector2(210, 30))
	time_label = _label(panel, "", 22, Vector2(400, 9), Vector2(250, 36))
	info_label = _label(hud, "Use ↑ para acelerar y ↓ para frenar", 18, Vector2(200, 108), Vector2(760, 40))
	sensor_label = _label(hud, "Móvil: pulse INCLINAR", 17, Vector2(12, 152), Vector2(930, 36))
	_hold(hud, "◀", "left_held")
	_hold(hud, "▶", "right_held")
	_hold(hud, "ACELERAR", "gas_held")
	_hold(hud, "FRENAR", "brake_held")
	buttons.append(_button(hud, "D", Vector2.ZERO, Vector2(45, 50), func() -> void: _set_gear("D")))
	buttons.append(_button(hud, "R", Vector2.ZERO, Vector2(45, 50), func() -> void: _set_gear("R")))
	buttons.append(_button(hud, "P", Vector2.ZERO, Vector2(45, 50), func() -> void: _set_gear("P")))
	buttons.append(_button(hud, "INCLINAR", Vector2.ZERO, Vector2(115, 42), _toggle_tilt))
	buttons.append(_button(hud, "CALIBRAR", Vector2.ZERO, Vector2(115, 42), _calibrate))
	buttons.append(_button(hud, "INVERTIR", Vector2.ZERO, Vector2(115, 42), _invert_tilt))
	start_overlay = _overlay(layer)
	intro_panel = _dialog(start_overlay)
	var intro := _label(intro_panel, "EXAMEN PRÁCTICO DE CONDUCCIÓN\n\nConduzca hasta la meta en cinco minutos.\nCada infracción detectada ocasiona descalificación inmediata, sin avisos previos.\n\nFlechas: acelerar, frenar y girar. D/R/P: selector automático.\nEn móvil use los botones; el sensor de inclinación puede no funcionar en navegador.", 20, Vector2(28, 22), Vector2(580, 280))
	intro.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_button(intro_panel, "INICIAR EXAMEN", Vector2(185, 325), Vector2(265, 48), _start)
	end_overlay = _overlay(layer)
	result_panel = _dialog(end_overlay)
	end_title = _label(result_panel, "PRUEBA REPROBADA", 25, Vector2(30, 58), Vector2(580, 90))
	end_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	end_detail = _label(result_panel, "", 21, Vector2(30, 175), Vector2(580, 110))
	end_detail.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_button(result_panel, "REPETIR EXAMEN", Vector2(185, 328), Vector2(265, 48), _start)
	end_overlay.visible = false

func _layout() -> void:
	if hud == null:
		return
	var sz := get_viewport().get_visible_rect().size
	hud.size = sz
	hud.get_node("HUDTop").size = Vector2(maxf(600.0, sz.x - 24.0), 90)
	time_label.position.x = maxf(320.0, sz.x * 0.48)
	info_label.position = Vector2(12, 111)
	info_label.size = Vector2(sz.x - 24, 40)
	sensor_label.position = Vector2(12, 150)
	sensor_label.size = Vector2(sz.x - 24, 35)
	if buttons.size() == 10:
		var base := sz.y - 104.0
		buttons[0].position = Vector2(12, base)
		buttons[1].position = Vector2(108, base)
		buttons[2].position = Vector2(sz.x - 150, base)
		buttons[3].position = Vector2(sz.x - 295, base)
		for i in range(4):
			buttons[i].size = Vector2(88 if i < 2 else 137, 73)
		for i in range(3):
			buttons[i + 4].position = Vector2(sz.x * 0.36 + float(i) * 50, base + 18)
			buttons[i + 4].size = Vector2(45, 50)
		buttons[7].position = Vector2(sz.x * 0.36, base - 37)
		buttons[8].position = Vector2(sz.x * 0.36 + 127, base - 37)
		buttons[9].position = Vector2(sz.x * 0.36 + 254, base - 37)
		for i in [7, 8, 9]:
			buttons[i].size = Vector2(118, 34)
	for layer in [start_overlay, end_overlay]:
		layer.size = sz
	for panel in [intro_panel, result_panel]:
		panel.size = Vector2(638, 395)
		panel.position = Vector2(maxf(0.0, (sz.x - 638.0) * 0.5), maxf(0.0, (sz.y - 395.0) * 0.5))
