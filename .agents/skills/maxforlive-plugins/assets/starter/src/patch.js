'use strict';

/**
 * Construtor de patches Max a partir de JavaScript.
 *
 * Gera o JSON de patcher no mesmo formato usado pelos templates oficiais do
 * Max for Live (Live 12). O objetivo é permitir criar devices legíveis,
 * versionáveis e reproduzíveis sem abrir o editor do Max.
 */

const { normalizeDeviceType, unixToMaxTime, DEVICE_TYPES } = require('./amxd');

/** Especificações padrão de objetos Max usados com frequência. */
const OBJECT_SPECS = {
  'plugin~': { inlets: 2, outlets: 2, outlettype: ['signal', 'signal'] },
  'plugout~': { inlets: 2, outlets: 2, outlettype: ['signal', 'signal'] },
  midiin: { inlets: 1, outlets: 1, outlettype: ['int'] },
  midiout: { inlets: 1, outlets: 0, outlettype: [] },
  midiparse: { inlets: 1, outlets: 8, outlettype: ['', '', '', '', '', '', '', ''] },
  midiformat: { inlets: 7, outlets: 2, outlettype: ['int', ''] },
  'live.thisdevice': { inlets: 1, outlets: 3, outlettype: ['bang', 'int', 'int'] },
  'live.path': { inlets: 1, outlets: 3, outlettype: ['', '', ''] },
  'live.object': { inlets: 1, outlets: 1, outlettype: [''] },
  'live.observer': { inlets: 1, outlets: 1, outlettype: [''] },
  'live.remote~': { inlets: 3, outlets: 1, outlettype: ['signal'] },
  'live.map': { inlets: 1, outlets: 1, outlettype: [''] },
  'live.banks': { inlets: 1, outlets: 0, outlettype: [] },
  'live.gain~': { inlets: 2, outlets: 2, outlettype: ['signal', 'signal'] },
  'live.meter~': { inlets: 1, outlets: 2, outlettype: ['', ''] },
  'live.step': { inlets: 1, outlets: 1, outlettype: [''] },
  'live.grid': { inlets: 1, outlets: 1, outlettype: [''] },
  'live.text': { inlets: 1, outlets: 2, outlettype: ['', ''] },
  'live.button': { inlets: 1, outlets: 1, outlettype: ['bang'] },
  'plugsync~': {
    inlets: 1,
    outlets: 9,
    outlettype: ['int', 'int', 'int', 'float', '', 'float', 'float', 'int', 'int'],
  },
  dbtoa: { inlets: 1, outlets: 1, outlettype: ['float'] },
  atodb: { inlets: 1, outlets: 1, outlettype: ['float'] },
  mtof: { inlets: 1, outlets: 1, outlettype: ['float'] },
  ftom: { inlets: 1, outlets: 1, outlettype: ['float'] },
  '*~': { inlets: 2, outlets: 1, outlettype: ['signal'] },
  '+~': { inlets: 2, outlets: 1, outlettype: ['signal'] },
  '-~': { inlets: 2, outlets: 1, outlettype: ['signal'] },
  '/~': { inlets: 2, outlets: 1, outlettype: ['signal'] },
  'cycle~': { inlets: 2, outlets: 1, outlettype: ['signal'] },
  'phasor~': { inlets: 2, outlets: 1, outlettype: ['signal'] },
  'sig~': { inlets: 1, outlets: 1, outlettype: ['signal'] },
  'line~': { inlets: 2, outlets: 1, outlettype: ['signal'] },
  'rampsmooth~': { inlets: 3, outlets: 1, outlettype: ['signal'] },
  'onepole~': { inlets: 2, outlets: 1, outlettype: ['signal'] },
  'lores~': { inlets: 3, outlets: 1, outlettype: ['signal'] },
  'svf~': { inlets: 3, outlets: 4, outlettype: ['signal', 'signal', 'signal', 'signal'] },
  'lores~': { inlets: 3, outlets: 1, outlettype: ['signal'] },
  'saw~': { inlets: 2, outlets: 1, outlettype: ['signal'] },
  'rect~': { inlets: 3, outlets: 1, outlettype: ['signal'] },
  'selector~': { inlets: 3, outlets: 1, outlettype: ['signal'] },
  'biquad~': { inlets: 6, outlets: 1, outlettype: ['signal'] },
  'pfft~': { inlets: 2, outlets: 2, outlettype: ['signal', 'signal'] },
  'poly~': { inlets: 1, outlets: 1, outlettype: ['signal'] },
  'adsr~': { inlets: 5, outlets: 4, outlettype: ['signal', 'bang', '', ''] },
  '*': { inlets: 2, outlets: 1, outlettype: ['int'] },
  '+': { inlets: 2, outlets: 1, outlettype: ['int'] },
  '-': { inlets: 2, outlets: 1, outlettype: ['int'] },
  '/': { inlets: 2, outlets: 1, outlettype: ['int'] },
  '%': { inlets: 2, outlets: 1, outlettype: ['int'] },
  random: { inlets: 2, outlets: 1, outlettype: ['int'] },
  counter: { inlets: 5, outlets: 4, outlettype: ['int', 'int', 'int', 'int'] },
  coll: { inlets: 1, outlets: 4, outlettype: ['', '', 'bang', 'bang'] },
  change: { inlets: 1, outlets: 3, outlettype: ['int', 'int', 'int'] },
  expr: { inlets: 1, outlets: 1, outlettype: ['float'] },
  f: { inlets: 2, outlets: 1, outlettype: ['float'] },
  float: { inlets: 2, outlets: 1, outlettype: ['float'] },
  'line~': { inlets: 2, outlets: 2, outlettype: ['signal', 'bang'] },
  '>': { inlets: 2, outlets: 1, outlettype: ['int'] },
  '<': { inlets: 2, outlets: 1, outlettype: ['int'] },
  '==': { inlets: 2, outlets: 1, outlettype: ['int'] },
  '&&': { inlets: 2, outlets: 1, outlettype: ['int'] },
  '||': { inlets: 2, outlets: 1, outlettype: ['int'] },
  '!-': { inlets: 2, outlets: 1, outlettype: ['int'] },
  unpack: { inlets: 1, outlets: 2, outlettype: ['int', 'int'] },
  pack: { inlets: 2, outlets: 1, outlettype: ['int'] },
  gate: { inlets: 2, outlets: 1, outlettype: [''] },
  switch: { inlets: 3, outlets: 1, outlettype: [''] },
  split: { inlets: 3, outlets: 2, outlettype: ['', ''] },
  sel: { inlets: 2, outlets: 2, outlettype: ['bang', 'bang'] },
  route: { inlets: 1, outlets: 2, outlettype: ['', ''] },
  trigger: { inlets: 1, outlets: 2, outlettype: ['', ''] },
  t: { inlets: 1, outlets: 2, outlettype: ['', ''] },
  metro: { inlets: 2, outlets: 1, outlettype: ['bang'] },
  qmetro: { inlets: 2, outlets: 1, outlettype: ['bang'] },
  delay: { inlets: 2, outlets: 1, outlettype: ['bang'] },
  pipe: { inlets: 2, outlets: 1, outlettype: [''] },
  loadbang: { inlets: 1, outlets: 1, outlettype: ['bang'] },
  loadmess: { inlets: 1, outlets: 1, outlettype: [''] },
  defer: { inlets: 1, outlets: 1, outlettype: [''] },
  deferlow: { inlets: 1, outlets: 1, outlettype: [''] },
  prepend: { inlets: 1, outlets: 1, outlettype: [''] },
  append: { inlets: 1, outlets: 1, outlettype: [''] },
  change: { inlets: 1, outlets: 1, outlettype: ['int'] },
  zl: { inlets: 1, outlets: 1, outlettype: [''] },
  sprintf: { inlets: 1, outlets: 1, outlettype: [''] },
  number: { inlets: 1, outlets: 1, outlettype: ['float'] },
  flonum: { inlets: 1, outlets: 1, outlettype: ['float'] },
  toggle: { inlets: 1, outlets: 1, outlettype: ['int'] },
  button: { inlets: 1, outlets: 1, outlettype: ['bang'] },
  comment: { inlets: 1, outlets: 0, outlettype: [] },
  message: { inlets: 2, outlets: 1, outlettype: [''] },
};

function objectBaseName(text) {
  return String(text).trim().split(/\s+/)[0];
}

function createPatcher({ deviceType = 'audio_effect', width = 160, title = '' } = {}) {
  const type = normalizeDeviceType(deviceType);
  const stamp = unixToMaxTime();
  const patcher = {
    fileversion: 1,
    appversion: { major: 8, minor: 1, revision: 2, architecture: 'x64', modernui: 1 },
    classnamespace: 'box',
    rect: [200, 120, 385, 229],
    openrect: [0, 0, 0, 169],
    bglocked: 0,
    openinpresentation: 1,
    default_fontsize: 10,
    default_fontface: 0,
    default_fontname: 'Arial Bold',
    gridonopen: 1,
    gridsize: [8, 8],
    gridsnaponopen: 1,
    objectsnaponopen: 1,
    statusbarvisible: 2,
    toolbarvisible: 1,
    lefttoolbarpinned: 0,
    toptoolbarpinned: 0,
    righttoolbarpinned: 0,
    bottomtoolbarpinned: 0,
    toolbars_unpinned_last_save: 0,
    tallnewobj: 0,
    boxanimatetime: 500,
    enablehscroll: 1,
    enablevscroll: 1,
    devicewidth: Math.round(width),
    description: '',
    digest: '',
    tags: '',
    style: '',
    subpatcher_template: '',
    boxes: [],
    lines: [],
    dependency_cache: [],
    latency: 0,
    project: {
      version: 1,
      creationdate: stamp,
      modificationdate: stamp,
      viewrect: [0, 0, 300, 500],
      autoorganize: 1,
      hideprojectwindow: 1,
      showdependencies: 1,
      autolocalize: 0,
      contents: { patchers: {} },
      layout: {},
      searchpath: {},
      detailsvisible: 0,
      amxdtype: DEVICE_TYPES[type].amxdtype,
      readonly: 0,
      devpathtype: 0,
      devpath: '.',
      sortmode: 0,
      viewmode: 0,
      includepackages: 0,
    },
    autosave: 0,
  };

  if (title) patcher.title = title;

  return { patcher };
}

function integerRect(rect, fallback = [0, 0, 0, 20]) {
  const r = Array.isArray(rect) && rect.length === 4 ? rect : fallback;
  return r.map((value) => Math.round(Number(value) || 0));
}

class PatchBuilder {
  constructor(options = {}) {
    this.deviceType = normalizeDeviceType(options.deviceType);
    this.width = Math.round(options.width || 160);
    this.wrapper = createPatcher({
      deviceType: this.deviceType,
      width: this.width,
      title: options.title || '',
    });
    this.patcher = this.wrapper.patcher;
    this._nextId = 1;
  }

  _newId() {
    return `obj-${this._nextId++}`;
  }

  /** Adiciona uma caixa crua. Retorna o objeto da caixa para conexões. */
  add(box) {
    const id = box.id || this._newId();
    const finalBox = { id, ...box };
    if (finalBox.patching_rect) {
      finalBox.patching_rect = integerRect(finalBox.patching_rect);
    }
    if (finalBox.presentation_rect) {
      finalBox.presentation_rect = integerRect(finalBox.presentation_rect);
    }
    this.patcher.boxes.push({ box: finalBox });
    return finalBox;
  }

  /** Cria um objeto Max (newobj). */
  obj(text, options = {}) {
    const spec = OBJECT_SPECS[objectBaseName(text)] || {};
    const {
      inlets = spec.inlets == null ? 1 : spec.inlets,
      outlets = spec.outlets == null ? 1 : spec.outlets,
      outlettype = spec.outlettype || Array(outlets).fill(''),
      rect = [0, 0, 0, 20],
      fontsize = 10,
      fontname = 'Arial Bold',
      ...rest
    } = options;

    return this.add({
      maxclass: 'newobj',
      text,
      numinlets: inlets,
      numoutlets: outlets,
      outlettype,
      patching_rect: rect,
      fontname,
      fontsize,
      ...rest,
    });
  }

  /** Caixa de mensagem (message). */
  message(text, options = {}) {
    return this.add({
      maxclass: 'message',
      text,
      numinlets: 2,
      numoutlets: 1,
      outlettype: [''],
      patching_rect: options.rect || [0, 0, 0, 20],
      ...options.extra,
    });
  }

  /** Comentário visível no device strip do Live. */
  comment(text, options = {}) {
    return this.add({
      maxclass: 'live.comment',
      text,
      numinlets: 1,
      numoutlets: 0,
      patching_rect: options.rect || [0, 0, 80, 16],
      textjustification: options.justification == null ? 1 : options.justification,
      ...(options.visible === false
        ? { hidden: 1 }
        : { presentation: 1, presentation_rect: options.presentation || options.rect || [0, 0, 80, 16] }),
      ...options.extra,
    });
  }

  /** Marca uma caixa como visível em presentation mode. */
  present(box, rect) {
    box.presentation = 1;
    box.presentation_rect = integerRect(rect);
    return box;
  }

  /** Conecta saída de uma caixa à entrada de outra. */
  connect(source, outlet, destination, inlet) {
    const sourceId = typeof source === 'string' ? source : source.id;
    const destinationId = typeof destination === 'string' ? destination : destination.id;
    this.patcher.lines.push({
      patchline: {
        source: [sourceId, outlet || 0],
        destination: [destinationId, inlet || 0],
      },
    });
  }

  /** Entrada de áudio do Live (stereo). */
  audioIn(rect = [40, 20, 53, 20]) {
    return this.obj('plugin~', { rect });
  }

  /** Saída de áudio para o Live (stereo). */
  audioOut(rect = [40, 150, 53, 20]) {
    return this.obj('plugout~', { rect });
  }

  midiIn(rect = [40, 20, 45, 20]) {
    return this.obj('midiin', { rect });
  }

  midiOut(rect = [40, 150, 47, 20]) {
    return this.obj('midiout', { rect });
  }

  thisDevice(rect = [200, 20, 80, 20]) {
    return this.obj('live.thisdevice', { rect });
  }

  /**
   * Dial com parâmetro exposto ao Live (automação, Push, mapeamento).
   * unitstyle: 0=Int, 1=Float, 2=Time, 3=Hz, 4=dB, 5=%, 6=Pan, 7=Semitones, 8=MIDI, 9=Custom
   * parameterType: 0=Float, 1=Int, 2=Enum, 3=Blob
   */
  dial(options = {}) {
    const {
      name,
      shortname = name,
      min = 0,
      max = 1,
      initial = 0,
      unitstyle = 1,
      exponent,
      annotation = '',
      rect = [16, 32, 48, 48],
      presentation,
      visible = true,
      parameterType = 0,
      enumValues,
    } = options;

    if (!name) throw new Error('dial() requer um nome de parâmetro');

    const valueof = {
      parameter_longname: name,
      parameter_shortname: shortname,
      parameter_type: enumValues ? 2 : parameterType,
      parameter_mmin: min,
      parameter_mmax: max,
      parameter_initial_enable: 1,
      parameter_initial: [initial],
      parameter_unitstyle: unitstyle,
    };
    if (enumValues) valueof.parameter_enum = enumValues;
    if (exponent != null) valueof.parameter_exponent = exponent;

    const box = this.add({
      maxclass: 'live.dial',
      numinlets: 1,
      numoutlets: 2,
      outlettype: ['', 'float'],
      parameter_enable: 1,
      varname: name,
      patching_rect: rect,
      saved_attribute_attributes: { valueof },
      ...(annotation ? { annotation } : {}),
    });

    if (visible) this.present(box, presentation || rect);
    return box;
  }

  /** Toggle booleano com parâmetro no Live. */
  toggle(options = {}) {
    const {
      name,
      shortname = name,
      initial = 0,
      rect = [16, 90, 20, 20],
      presentation,
      visible = true,
      annotation = '',
    } = options;

    if (!name) throw new Error('toggle() requer um nome de parâmetro');

    const box = this.add({
      maxclass: 'live.toggle',
      numinlets: 1,
      numoutlets: 1,
      outlettype: [''],
      parameter_enable: 1,
      varname: name,
      patching_rect: rect,
      saved_attribute_attributes: {
        valueof: {
          parameter_longname: name,
          parameter_shortname: shortname,
          parameter_type: 2,
          parameter_enum: ['off', 'on'],
          parameter_initial_enable: 1,
          parameter_initial: [initial ? 1 : 0],
          parameter_unitstyle: 0,
        },
      },
      ...(annotation ? { annotation } : {}),
    });

    if (visible) this.present(box, presentation || rect);
    return box;
  }

  /** Menu suspenso com parâmetro enum no Live. */
  menu(options = {}) {
    const {
      name,
      shortname = name,
      items,
      initial = 0,
      rect = [16, 90, 80, 18],
      presentation,
      visible = true,
      annotation = '',
    } = options;

    if (!name) throw new Error('menu() requer um nome de parâmetro');
    if (!Array.isArray(items) || !items.length) throw new Error('menu() requer items');

    const box = this.add({
      maxclass: 'live.menu',
      numinlets: 1,
      numoutlets: 3,
      outlettype: ['', '', 'float'],
      parameter_enable: 1,
      varname: name,
      patching_rect: rect,
      saved_attribute_attributes: {
        valueof: {
          parameter_longname: name,
          parameter_shortname: shortname,
          parameter_type: 2,
          parameter_enum: items,
          parameter_initial_enable: 1,
          parameter_initial: [initial],
          parameter_unitstyle: 0,
        },
      },
      ...(annotation ? { annotation } : {}),
    });

    if (visible) this.present(box, presentation || rect);
    return box;
  }

  /** Abas (live.tab) com parâmetro enum no Live. */
  tab(options = {}) {
    const {
      name,
      shortname = name,
      items,
      initial = 0,
      rect = [16, 120, 80, 18],
      presentation,
      visible = true,
    } = options;

    if (!name) throw new Error('tab() requer um nome de parâmetro');
    if (!Array.isArray(items) || !items.length) throw new Error('tab() requer items');

    const box = this.add({
      maxclass: 'live.tab',
      numinlets: 1,
      numoutlets: 3,
      outlettype: ['', '', 'float'],
      parameter_enable: 1,
      varname: name,
      patching_rect: rect,
      saved_attribute_attributes: {
        valueof: {
          parameter_longname: name,
          parameter_shortname: shortname,
          parameter_type: 2,
          parameter_enum: items,
          parameter_initial_enable: 1,
          parameter_initial: [initial],
          parameter_unitstyle: 0,
        },
      },
    });

    if (visible) this.present(box, presentation || rect);
    return box;
  }

  /** Botão momentâneo nativo (live.text em modo button). */
  textButton(options = {}) {
    const {
      name,
      shortname = name,
      text = name,
      rect = [16, 140, 80, 20],
      presentation,
      annotation = '',
    } = options;

    if (!name) throw new Error('textButton() requer um nome de parâmetro');

    const box = this.add({
      maxclass: 'live.text',
      mode: 0, // button (momentâneo)
      numinlets: 1,
      numoutlets: 2,
      outlettype: ['', ''],
      parameter_enable: 1,
      varname: name,
      text,
      patching_rect: rect,
      saved_attribute_attributes: {
        valueof: {
          parameter_longname: name,
          parameter_shortname: shortname,
          parameter_type: 2,
          parameter_mmax: 1,
          parameter_enum: ['off', 'on'],
          parameter_initial_enable: 1,
          parameter_initial: [0],
          parameter_unitstyle: 0,
        },
      },
      ...(annotation ? { annotation } : {}),
    });

    this.present(box, presentation || rect);
    return box;
  }

  /** Medidor de nível (não é parâmetro). */
  meter(rect = [90, 32, 12, 100], options = {}) {
    const box = this.add({
      maxclass: 'live.meter~',
      numinlets: 1,
      numoutlets: 2,
      outlettype: ['', ''],
      patching_rect: rect,
      ...options,
    });
    return this.present(box, rect);
  }

  /** Finaliza e devolve o wrapper pronto para packAmxd(). */
  finish() {
    this.patcher.devicewidth = this.width;
    return this.wrapper;
  }
}

module.exports = {
  OBJECT_SPECS,
  createPatcher,
  PatchBuilder,
  integerRect,
};
