export { EditorLibre, describirElemento, describirSeleccion, type EditorLibreProps } from "./editor-libre.js";
export { EditorLibreModal, type EditorLibreModalProps } from "./editor-libre-modal.js";
export { ejecutarComando, elegibles, ordenDeTecla, type Comando, type EstadoEditor, type Orden } from "./comandos.js";
export { asaEn, cursorDeAsa, marcoDeSeleccion, posicionesDeAsas, type Marco, type TipoAsa } from "./asas.js";
export { avanzarGesto, iniciarMover, iniciarRecuadro, iniciarRedimensionar, iniciarRotar, seleccionAlHacerClic, type Gesto, type Modificadores, type OpcionesGesto, type ResultadoGesto } from "./gestos.js";
export { ZOOM_MAX, ZOOM_MIN, ajustarAVentana, desplazar, escenaAPantalla, pantallaAEscena, zoomEn, type Vista } from "./vista.js";
