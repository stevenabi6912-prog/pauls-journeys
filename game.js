import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader }      from 'three/addons/shaders/FXAAShader.js';
import { Sky }             from 'three/addons/objects/Sky.js';

// ============================================================
//  PAUL'S JOURNEYS — 3D Game Engine (game.js)
//  Three.js top-down RPG — Jerusalem 34 AD
// ============================================================

const Game = {
  renderer:    null,
  composer:    null,
  fxaaPass:    null,
  scene:       null,
  camera:      null,
  playerGroup: null,
  npcObjects:  {},   // id -> { group, data }
  signObjects: [],   // { group, data }
  lampLights:  [],

  player: {
    pos:         null,
    speed:       6,
    moving:      false,
    animTime:    0,
    facingAngle: 0,
    jumpY:       0,
    jumpVel:     0,
    isJumping:   false,
  },

  cam: {
    offsetY: 9,
    offsetZ: 12,
    pos:     null,   // THREE.Vector3, set in init
  },

  keys: {},
  joy:  { active: false, angle: 0, mag: 0 },

  dialogueActive:   false,
  dialogueQueue:    [],
  dialogueIndex:    0,
  dialogueTyping:   false,
  typeTimer:        null,
  dialogueCallback: null,
  currentDialogueNPC: null,

  hasLetters:          false,
  gateUnlocked:        false,
  templeInside:        false,
  templeTransitioning: false,
  templeLight:         null,
  damascusTriggered:   false,
  damascusRoadActive:  false,
  blindActive:         false,
  encounterTriggered:  false,
  sightRestored:       false,
  ananiasGroup:        null,
  damascusColliders:   [],
  interactCooldown:    0,
  gateBlockCooldown:   0,
  lastTime:            0,

  companionsRecruited: 0,
  horsesAcquired:      false,
  recruitedNPCs:       {},
  inventory:           { shekels: 5, tentCloth: 0, tents: 0, denarii: 0 },
  minigameActive:      false,
  horseObjects:        [],
  choiceActive:        false,
  purchasedCloth:      false,
  craftedTent:         false,
  hintActive:          false,
  cutsceneActive:      false,
  cutsceneTimer:       0,

  // ── FIRST MISSIONARY JOURNEY STATE ───────────────────────
  antiochDenarii:      0,
  antiochCommissioned: false,
  journeyPhase:        0,    // 0=Jerusalem, 1=Damascus, 2=Antioch, 3=SeaVoyage, 4=Salamis, 5=Paphos, 6=MtnPass, 7=PisidianAntioch, 8=Iconium
  playerName:          'Saul',
  elymosBlinded:       false,
  sergiusBelieved:     false,
  nameChanged:         false,
  antiochLoomVisits:   0,
  salamisSynagogueVisited: false,
  sermonScore:         0,
  sermonComplete:      false,
  pisidiaWeek2:        false,
  pisidiaEscaping:     false,
  pisidiaEscapeTimer:  0,

  // ── JOURNEY 1 EXTENDED STATE ──────────────────────────────
  antiochActive:       false,
  antiochNPCsMet:      {},
  antiochLeadersMet:   0,
  antiochAllMet:       false,
  antiochChurchEntered:false,
  lystraPhase:         0,      // 0=healing, 1=zeus, 2=stoning
  stoneCount:          0,
  derbeComplete:       false,
  j1Complete:          false,
  mtnPassActive:       false,
  mtnPassTime:         0,
  returnJourneyActive: false,
  currentScene:        'jerusalem', // track active scene name

  // ── SEA VOYAGE STATE ──────────────────────────────────────
  voyageActive:        false,
  voyageTime:          0,
  voyageTimeLimit:     90,
  voyageBoat:          null,
  voyageObstacles:     [],
  voyageScrolls:       [],
  voyageBoatX:        0,
  voyageBoatTargetX:  0,
  voyageSpeed:        4,
  voyageInvincible:   0,
  voyageLives:        3,
  voyageFinished:     false,
  voyagePrevJoy:      false,

  // ── MOUNTAIN PASS STATE ───────────────────────────────────
  mountainActive:      false,
  mountainTime:        0,
  mountainMarkShown:   false,
  npcPatrolStates:          {},
  dustParticles:            [],
  dustSpawnTimer:           0,
  templeBackBonusCollected: false,
  questReadyPopupShown:     false,
  ambientCtx:               null,

  // ── RUNNER STATE ──────────────────────────────────────────
  runnerActive:      false,
  runnerLane:        1,         // 0=left 1=center 2=right
  runnerTargetLane:  1,
  runnerLaneX:       [-2.5, 0, 2.5],
  runnerSpeed:       8,         // units / sec forward
  runnerTime:        0,         // elapsed seconds
  runnerTimeLimit:   118,       // finish just under 2 min
  runnerJumping:     false,
  runnerJumpVel:     0,
  runnerJumpY:       0,
  runnerLives:       3,
  runnerInvincible:  0,
  runnerFinished:    false,
  runnerObstacles:   [],        // { mesh, laneX, z, type }
  runnerCoins:       [],        // { mesh, laneX, z, elevated }
  runnerRoadMeshes:  [],        // road chunks to despawn
  runnerHorse:       null,
  runnerPaulRider:   null,
  runnerNextZ:       30,        // next z to spawn content
  runnerLanePrevJoy: false,     // edge-detect joystick lane input
  runnerShake:       0,         // camera shake intensity
  runnerSlowed:      0,         // slow timer (sand dune effect)
  runnerDoubleCoin:  0,         // double coin timer
  runnerMultiplier:  1,         // score multiplier
  runnerMultiplierTimer: 0,     // time since last coin
  runnerMilestones:  [30, 60, 90], // biblical quote milestones (seconds)
  runnerMilestonePrev: 0,       // last milestone check time
  runnerDustParticles: [],      // dust particle meshes behind horse
  runnerAmbientLight: null,     // ambient light ref for end-sequence
  runnerEndLight:    null,      // growing white light near end

  // ── DOM REFS ──────────────────────────────────────────────
  elDialogueBox:    null,
  elDialogueSpeaker: null,
  elDialogueText:   null,
  elDialoguePrompt: null,
  elInteractPrompt: null,
  elQuestText:      null,
  elScriptureRef:   null,
  elNotification:   null,
  elNotifText:      null,
  elJoyBase:        null,
  elJoyThumb:       null,
  elCompassFace:    null,

  // ── INIT ─────────────────────────────────────────────────
  init() {
    // Opening title card — show immediately before heavy 3D load
    this.showOpeningCard();

    const canvas = document.getElementById('game-canvas');

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.Fog(0xe8d4a0, 55, 140);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 200);

    // Player state
    this.player.pos = new THREE.Vector3(0, 0, 17);
    this.cam.pos    = new THREE.Vector3(0, 9, 29);

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.4, 0.82
    );
    this.composer.addPass(bloom);
    this.composer.addPass(new OutputPass());
    this.fxaaPass = new ShaderPass(FXAAShader);
    this.composer.addPass(this.fxaaPass);

    // Build world
    this.setupLighting();
    this.buildWorld();
    this.buildPlayer();
    this.buildNPCs();
    this.buildSigns();

    // Resize
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Cache DOM
    this.elDialogueBox     = document.getElementById('dialogue-box');
    this.elDialogueSpeaker = document.getElementById('dialogue-speaker');
    this.elDialogueText    = document.getElementById('dialogue-text');
    this.elDialoguePrompt  = document.getElementById('dialogue-prompt');
    this.elInteractPrompt  = document.getElementById('interact-prompt');
    this.elQuestText       = document.getElementById('quest-text');
    this.elScriptureRef    = document.getElementById('scripture-ref');
    this.elNotification    = document.getElementById('notification');
    this.elNotifText       = document.getElementById('notif-text');
    this.elJoyBase         = document.getElementById('joystick-base');
    this.elJoyThumb        = document.getElementById('joystick-thumb');
    this.elCompassFace     = document.getElementById('compass-face');

    // Input
    this.setupInput();

    // Start loop
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  },

  // ── RESIZE ────────────────────────────────────────────────
  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setSize(w, h);
      if (this.fxaaPass) {
        const pr = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms['resolution'].value.set(1 / (w * pr), 1 / (h * pr));
      }
    }
  },

  // ── LIGHTING ──────────────────────────────────────────────
  setupLighting() {
    // Golden afternoon — warm amber sky, sandy bounce
    const hemi = new THREE.HemisphereLight(0xffd890, 0xc49060, 0.65);
    this.scene.add(hemi);

    // Sun — low western afternoon angle, warm orange-gold
    const sun = new THREE.DirectionalLight(0xffaa50, 2.0);
    sun.position.set(40, 20, 18);   // lower + westward = longer shadows
    sun.castShadow = true;
    sun.shadow.mapSize.width  = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left   = -60;
    sun.shadow.camera.right  =  60;
    sun.shadow.camera.top    =  60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.camera.near   = 1;
    sun.shadow.camera.far    = 120;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);

    // Warm eastern fill — soft amber shadow fill
    const rim = new THREE.DirectionalLight(0xc49050, 0.30);
    rim.position.set(-10, 12, -20);
    this.scene.add(rim);
  },

  // ── BUILD WORLD ───────────────────────────────────────────
  buildWorld() {
    // Procedural sky
    const sky = new Sky();
    sky.scale.setScalar(450);
    this.scene.add(sky);
    const su = sky.material.uniforms;
    su['turbidity'].value       = 5;
    su['rayleigh'].value        = 1.8;
    su['mieCoefficient'].value  = 0.004;
    su['mieDirectionalG'].value = 0.82;
    const sunDir = new THREE.Vector3();
    sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(68), THREE.MathUtils.degToRad(20));
    su['sunPosition'].value.copy(sunDir);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xc4956a, roughness: 0.95, metalness: 0 });
    const ground    = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Buildings
    for (const b of WORLD.buildings) {
      this.addBuilding(b);
    }

    // Paths
    for (const p of WORLD.paths) {
      this.addPath(p);
    }

    // Palm trees
    for (const palm of WORLD.palms) {
      this.addPalm(palm.x, palm.z);
    }

    // Market stalls
    for (const stall of WORLD.stalls) {
      this.addStall(stall);
    }

    // Decorations
    for (const dec of WORLD.decorations) {
      this.addDecoration(dec);
    }

    // Temple interior furnishings
    this.buildTempleInterior();
    // Stable pen
    this.buildStablePen();
  },

  addBuilding(b) {
    const geo  = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mat  = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: b.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(b.x, b.h / 2, b.z);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    if (b.roofColor !== undefined) {
      const rGeo  = new THREE.BoxGeometry(b.w + 0.15, 0.18, b.d + 0.15);
      const rMat  = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: b.roofColor });
      const roof  = new THREE.Mesh(rGeo, rMat);
      roof.position.set(b.x, b.h + 0.09, b.z);
      roof.castShadow = true;
      this.scene.add(roof);
    }
  },

  addPath(p) {
    const geo  = new THREE.BoxGeometry(p.w, 0.06, p.d);
    const mat  = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: p.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.x, p.y || 0.03, p.z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  },

  addPalm(x, z) {
    // Trunk
    const trunkGeo  = new THREE.CylinderGeometry(0.13, 0.2, 3.2, 6);
    const trunkMat  = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x7a5010 });
    const trunk     = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 1.6, z);
    trunk.castShadow = true;
    this.scene.add(trunk);

    // Leaf clusters
    const leafOffsets = [
      [  0,    0,    0   ],
      [  0.9, -0.3,  0.2 ],
      [ -0.9, -0.3,  0.2 ],
      [  0.2, -0.3,  0.9 ],
      [ -0.2, -0.3, -0.9 ],
      [  0.6, -0.2, -0.6 ],
    ];
    const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x2d7a2d });
    for (const off of leafOffsets) {
      const leafGeo  = new THREE.SphereGeometry(0.55, 5, 4);
      const leaf     = new THREE.Mesh(leafGeo, leafMat);
      leaf.scale.set(1, 0.28, 1);
      leaf.position.set(x + off[0], 3.4 + off[1], z + off[2]);
      leaf.castShadow = true;
      this.scene.add(leaf);
    }
  },

  addStall(s) {
    const group = new THREE.Group();

    // Table top
    const topGeo = new THREE.BoxGeometry(2.2, 0.1, 1.3);
    const topMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x8b5e2a });
    const top    = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.85;
    top.castShadow = true;
    group.add(top);

    // 4 legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.85, 0.1);
    const legMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x6b3e0a });
    const legPositions = [
      [ 0.95, 0.425,  0.55],
      [-0.95, 0.425,  0.55],
      [ 0.95, 0.425, -0.55],
      [-0.95, 0.425, -0.55],
    ];
    for (const lp of legPositions) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lp[0], lp[1], lp[2]);
      group.add(leg);
    }

    // Awning
    const awningGeo = new THREE.BoxGeometry(2.5, 0.1, 1.6);
    const awningMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: s.color });
    const awning    = new THREE.Mesh(awningGeo, awningMat);
    awning.position.y = 2.0;
    awning.castShadow = true;
    group.add(awning);

    // 4 awning poles
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.15, 5);
    const poleMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x6b3e0a });
    const polePositions = [
      [ 0.95, 1.42,  0.55],
      [-0.95, 1.42,  0.55],
      [ 0.95, 1.42, -0.55],
      [-0.95, 1.42, -0.55],
    ];
    for (const pp of polePositions) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(pp[0], pp[1], pp[2]);
      group.add(pole);
    }

    // 3 item spheres on table
    const itemColors = [0xc8a820, 0xc03018, 0x80a030];
    const itemGeo    = new THREE.SphereGeometry(0.13, 5, 4);
    for (let i = 0; i < 3; i++) {
      const itemMat  = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: itemColors[i] });
      const item     = new THREE.Mesh(itemGeo, itemMat);
      item.position.set(-0.5 + i * 0.5, 0.97, 0);
      group.add(item);
    }

    group.position.set(s.x, 0, s.z);
    this.scene.add(group);
  },

  addDecoration(d) {
    if (d.type === 'pot') {
      const geo  = new THREE.CylinderGeometry(0.18, 0.12, 0.4, 7);
      const mat  = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0xa05030 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, 0.2, d.z);
      mesh.castShadow = true;
      this.scene.add(mesh);

    } else if (d.type === 'lamp') {
      // Pole
      const poleGeo  = new THREE.CylinderGeometry(0.05, 0.05, 2.8, 5);
      const poleMat  = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x6a4a20 });
      const pole     = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(d.x, 1.4, d.z);
      this.scene.add(pole);

      // Globe
      const globeGeo = new THREE.SphereGeometry(0.16, 7, 5);
      const globeMat = new THREE.MeshStandardMaterial({
        color: 0xffd070,
        emissive: new THREE.Color(0xffd070),
        roughness: 0.1, metalness: 0,
        emissiveIntensity: 2.0,
      });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      globe.position.set(d.x, 2.9, d.z);
      this.scene.add(globe);

      // Point light
      const light = new THREE.PointLight(0xffd070, 0.8, 6);
      light.position.set(d.x, 2.9, d.z);
      this.scene.add(light);
      this.lampLights.push(light);
    }
  },

  // ── BUILD PLAYER ──────────────────────────────────────────
  buildPlayer() {
    const group = new THREE.Group();

    // Robe
    const robeGeo = new THREE.CylinderGeometry(0.22, 0.38, 1.05, 8);
    const robeMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x5a4030 });
    const robe    = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.525;
    robe.castShadow = true;
    group.add(robe);
    group.robe = robe;

    // Robe hem accent ring
    const hemGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.07, 8);
    const hemMat = new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.82, color: 0xc9a84c });
    const hem    = new THREE.Mesh(hemGeo, hemMat);
    hem.position.y = 0.035;
    group.add(hem);

    // Belt
    const beltGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.07, 8);
    const beltMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.6, color: 0x8b5e20 });
    const belt    = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.72;
    group.add(belt);

    // Head
    const headGeo = new THREE.SphereGeometry(0.23, 8, 6);
    const headMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0xc09060 });
    const head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.26;
    head.castShadow = true;
    group.add(head);

    // Headband ring
    const bandGeo = new THREE.TorusGeometry(0.23, 0.03, 4, 12);
    const bandMat = new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.82, color: 0xc9a84c });
    const band    = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = 1.30;
    group.add(band);

    // Beard
    const beardGeo = new THREE.SphereGeometry(0.13, 6, 4);
    const beardMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x4a3020 });
    const beard    = new THREE.Mesh(beardGeo, beardMat);
    beard.scale.set(1, 0.7, 0.8);
    beard.position.set(0, 1.14, 0.15);
    group.add(beard);

    // Eyes (front-facing, clearly show direction)
    const eyeMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x1a0800 });
    [-0.07, 0.07].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 5, 4), eyeMat);
      eye.position.set(ex, 1.30, 0.20);
      group.add(eye);
    });

    // Nose
    const noseMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0xa06040 });
    const nose    = new THREE.Mesh(new THREE.SphereGeometry(0.038, 5, 4), noseMat);
    nose.position.set(0, 1.23, 0.22);
    group.add(nose);

    // Belt buckle (front indicator — glints gold)
    const buckleMat = new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.9, color: 0xf0c830 });
    const buckle    = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.05), buckleMat);
    buckle.position.set(0, 0.72, 0.29);
    group.add(buckle);

    group.position.set(0, 0, 17);
    this.playerGroup = group;
    this.scene.add(group);
  },

  // ── BUILD NPCs ────────────────────────────────────────────
  buildNPCs() {
    for (const npcData of WORLD.npcs) {
      const group = this.createNPCGroup(npcData);
      const ny = this.getTerrainY(npcData.x, npcData.z);
      group.position.set(npcData.x, ny, npcData.z);
      this.npcObjects[npcData.id] = { group: group, data: npcData };
      this.scene.add(group);
      if (npcData.patrol) {
        this.npcPatrolStates[npcData.id] = { t: 0, dir: 1 };
      }
    }
  },

  // ── BUILD SIGNS ───────────────────────────────────────────
  buildSigns() {
    this.signObjects = [];
    for (const s of WORLD.signs) {
      const group = new THREE.Group();

      // Post
      const postGeo = new THREE.BoxGeometry(0.1, 1.6, 0.1);
      const postMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0x6b3e0a });
      const post    = new THREE.Mesh(postGeo, postMat);
      post.position.y = 0.8;
      post.castShadow = true;
      group.add(post);

      // Board
      const boardGeo = new THREE.BoxGeometry(1.5, 0.65, 0.09);
      const boardMat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0, color: 0xd4a85a });
      const board    = new THREE.Mesh(boardGeo, boardMat);
      board.position.y = 1.57;
      board.castShadow = true;
      group.add(board);

      // Gold trim edges
      const trimMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.7, color: 0xb8892a });
      const topTrim = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.06, 0.1), trimMat);
      topTrim.position.y = 1.92;
      group.add(topTrim);
      const botTrim = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.06, 0.1), trimMat);
      botTrim.position.y = 1.22;
      group.add(botTrim);

      group.position.set(s.x, 0, s.z);
      this.scene.add(group);
      this.signObjects.push({ group, data: s });
    }
  },

  createNPCGroup(npc) {
    const group = new THREE.Group();

    if (npc.isRomanSoldier) {
      // Armored tunic
      const robeGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.85, 8);
      const robeMat = new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.25, color: npc.bodyColor });
      const robe    = new THREE.Mesh(robeGeo, robeMat);
      robe.position.y = 0.42;
      robe.castShadow = true;
      group.add(robe);
      // Bronze hem/belt strip
      const beltGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.07, 8);
      const beltMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.75, color: npc.accentColor });
      const belt    = new THREE.Mesh(beltGeo, beltMat);
      belt.position.y = 0.12;
      group.add(belt);
      // Head
      const headGeo = new THREE.SphereGeometry(0.21, 8, 6);
      const headMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: npc.headColor });
      const head    = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.22;
      head.castShadow = true;
      group.add(head);
      // Eyes
      const solEyeGeo = new THREE.SphereGeometry(0.028, 5, 4);
      const solEyeMat = new THREE.MeshStandardMaterial({ roughness: 0.8, color: 0x120808 });
      const solEyeL   = new THREE.Mesh(solEyeGeo, solEyeMat);
      solEyeL.position.set(-0.075, 1.235, 0.185);
      const solEyeR   = new THREE.Mesh(solEyeGeo, solEyeMat);
      solEyeR.position.set( 0.075, 1.235, 0.185);
      group.add(solEyeL, solEyeR);

      // Iron helmet (galea)
      const helmGeo = new THREE.CylinderGeometry(0.11, 0.24, 0.18, 8);
      const helmMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.85, color: 0x707878 });
      const helm    = new THREE.Mesh(helmGeo, helmMat);
      helm.position.y = 1.48;
      group.add(helm);
      // Red crest (crista transversa)
      const crestGeo = new THREE.BoxGeometry(0.05, 0.2, 0.42);
      const crestMat = new THREE.MeshStandardMaterial({ roughness: 0.9, color: 0xcc1818 });
      const crest   = new THREE.Mesh(crestGeo, crestMat);
      crest.position.y = 1.68;
      group.add(crest);
      // Wooden spear shaft
      const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.2, 5);
      const shaftMat = new THREE.MeshStandardMaterial({ roughness: 0.8, color: 0x7a4a18 });
      const shaft   = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(0.34, 1.1, 0);
      shaft.castShadow = true;
      group.add(shaft);
      // Iron spear tip
      const tipGeo = new THREE.ConeGeometry(0.04, 0.18, 5);
      const tipMat = new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.9, color: 0xd0d8d0 });
      const tip    = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(0.34, 2.29, 0);
      group.add(tip);

    } else if (npc.isHighPriest) {
      // Wider robe
      const robeGeo = new THREE.CylinderGeometry(0.26, 0.46, 1.1, 8);
      const robeMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: npc.bodyColor });
      const robe    = new THREE.Mesh(robeGeo, robeMat);
      robe.position.y = 0.55;
      robe.castShadow = true;
      group.add(robe);

      // Wider hem
      const hemGeo = new THREE.CylinderGeometry(0.47, 0.47, 0.07, 8);
      const hemMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: npc.accentColor });
      const hem    = new THREE.Mesh(hemGeo, hemMat);
      hem.position.y = 0.035;
      group.add(hem);

      // Larger head
      const headGeo = new THREE.SphereGeometry(0.25, 8, 6);
      const headMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: npc.headColor });
      const head    = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.32;
      head.castShadow = true;
      group.add(head);

      // Mitre (tall priest hat)
      const mitreGeo = new THREE.CylinderGeometry(0.07, 0.24, 0.55, 6);
      const mitreMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: 0xf5f0e0 });
      const mitre    = new THREE.Mesh(mitreGeo, mitreMat);
      mitre.position.y = 1.87;
      group.add(mitre);

      // White hair (beneath mitre)
      const hpHairGeo = new THREE.SphereGeometry(0.252, 7, 5);
      const hpHairMat = new THREE.MeshStandardMaterial({ roughness: 0.95, color: 0xe8e0d0 });
      const hpHair    = new THREE.Mesh(hpHairGeo, hpHairMat);
      hpHair.scale.y  = 0.46;
      hpHair.position.y = 1.18;
      group.add(hpHair);

      // Eyes
      const hpEyeGeo = new THREE.SphereGeometry(0.03, 5, 4);
      const hpEyeMat = new THREE.MeshStandardMaterial({ roughness: 0.8, color: 0x120808 });
      const hpEyeL   = new THREE.Mesh(hpEyeGeo, hpEyeMat);
      hpEyeL.position.set(-0.085, 1.345, 0.22);
      const hpEyeR   = new THREE.Mesh(hpEyeGeo, hpEyeMat);
      hpEyeR.position.set( 0.085, 1.345, 0.22);
      group.add(hpEyeL, hpEyeR);

      // Breastplate
      const bpGeo = new THREE.BoxGeometry(0.4, 0.32, 0.06);
      const bpMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: npc.accentColor });
      const bp    = new THREE.Mesh(bpGeo, bpMat);
      bp.position.set(0, 0.85, 0.28);
      group.add(bp);

      // 4 gems on breastplate (2x2 grid)
      const gemColors = [0xff2020, 0x2040ff, 0x20c040, 0xffd020];
      const gemGeo    = new THREE.BoxGeometry(0.07, 0.07, 0.07);
      const gemPositions = [
        [-0.1,  0.05, 0.06],
        [ 0.1,  0.05, 0.06],
        [-0.1, -0.08, 0.06],
        [ 0.1, -0.08, 0.06],
      ];
      for (let i = 0; i < 4; i++) {
        const gemMat = new THREE.MeshStandardMaterial({ roughness: 0.05, metalness: 0.1, color: gemColors[i], emissive: new THREE.Color(gemColors[i]), emissiveIntensity: 0.4 });
        const gem    = new THREE.Mesh(gemGeo, gemMat);
        gem.position.set(
          bp.position.x + gemPositions[i][0],
          bp.position.y + gemPositions[i][1],
          bp.position.z + gemPositions[i][2]
        );
        group.add(gem);
      }

    } else {
      // Regular NPC robe
      const robeGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.0, 7);
      const robeMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: npc.bodyColor });
      const robe    = new THREE.Mesh(robeGeo, robeMat);
      robe.position.y = 0.5;
      robe.castShadow = true;
      group.add(robe);

      // Hem
      const hemGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.06, 7);
      const hemMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: npc.accentColor });
      const hem    = new THREE.Mesh(hemGeo, hemMat);
      hem.position.y = 0.03;
      group.add(hem);

      // Head
      const headGeo = new THREE.SphereGeometry(0.21, 8, 6);
      const headMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: npc.headColor });
      const head    = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.21;
      head.castShadow = true;
      group.add(head);

      // Head wrap
      const wrapGeo = new THREE.CylinderGeometry(0.215, 0.215, 0.055, 8);
      const wrapMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: npc.accentColor });
      const wrap    = new THREE.Mesh(wrapGeo, wrapMat);
      wrap.position.y = 1.25;
      group.add(wrap);

      // Hair (dark cap beneath wrap)
      const npcHairGeo = new THREE.SphereGeometry(0.218, 7, 5);
      const npcHairMat = new THREE.MeshStandardMaterial({ roughness: 0.95, color: npc.hairColor || 0x1e0e06 });
      const npcHair    = new THREE.Mesh(npcHairGeo, npcHairMat);
      npcHair.scale.y  = 0.48;
      npcHair.position.y = 1.10;
      group.add(npcHair);

      // Eyes
      const npcEyeGeo = new THREE.SphereGeometry(0.028, 5, 4);
      const npcEyeMat = new THREE.MeshStandardMaterial({ roughness: 0.8, color: 0x120808 });
      const npcEyeL   = new THREE.Mesh(npcEyeGeo, npcEyeMat);
      npcEyeL.position.set(-0.075, 1.235, 0.185);
      const npcEyeR   = new THREE.Mesh(npcEyeGeo, npcEyeMat);
      npcEyeR.position.set( 0.075, 1.235, 0.185);
      group.add(npcEyeL, npcEyeR);
    }

    return group;
  },

  // ── INPUT ─────────────────────────────────────────────────
  setupInput() {
    // Detect touch device — works on real phones AND browser emulation
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.body.classList.add('touch-device');
    }

    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        this.tryInteract();
      }
      if (e.key === ' ') {
        e.preventDefault();
        this.tryJump();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.dismissDialogue();
      }
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key) !== -1) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    // Dialogue advance on click
    const dialogueBox = document.getElementById('dialogue-box');
    dialogueBox.addEventListener('click', () => {
      this.advanceDialogue();
    });

    // Interact button (mobile) — touchstart so it fires while joystick is held
    const interactBtn = document.getElementById('interact-btn');
    interactBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.tryInteract();
    }, { passive: false });
    interactBtn.addEventListener('click', () => { this.tryInteract(); }); // desktop fallback

    // Satchel button
    const satchelBtn = document.getElementById('satchel-btn');
    if (satchelBtn) {
      satchelBtn.addEventListener('click', (e) => { e.stopPropagation(); this.openSatchel(); });
      satchelBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); this.openSatchel(); }, { passive: false });
    }
    const satchelClose = document.getElementById('satchel-popup-close');
    if (satchelClose) {
      satchelClose.addEventListener('click', () => this.closeSatchel());
      satchelClose.addEventListener('touchstart', (e) => { e.preventDefault(); this.closeSatchel(); }, { passive: false });
    }
    const satchelOverlay = document.getElementById('satchel-popup');
    if (satchelOverlay) {
      satchelOverlay.addEventListener('click', (e) => {
        if (e.target === satchelOverlay) this.closeSatchel();
      });
    }

    // Jump button (mobile)
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.tryJump();
      }, { passive: false });
      jumpBtn.addEventListener('click', () => { this.tryJump(); }); // desktop fallback
    }

    // Joystick
    this.setupJoystick();
  },

  setupJoystick() {
    const zone  = document.getElementById('joystick-zone');
    const base  = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');

    let originX   = 0;
    let originY   = 0;
    let joyTouchId = null;  // track which finger owns the joystick
    const DEAD    = 50;     // max radius px

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      // Only claim the first unclaimed touch
      if (joyTouchId !== null) return;
      const touch    = e.changedTouches[0];
      joyTouchId     = touch.identifier;
      originX        = touch.clientX;
      originY        = touch.clientY;

      base.style.left    = (originX - 45) + 'px';
      base.style.top     = (originY - 45) + 'px';
      base.style.opacity = '1';
      thumb.style.transform = 'translate(-50%, -50%)';

      this.joy.active = true;
      this.joy.mag    = 0;
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier !== joyTouchId) continue;
        const dx      = touch.clientX - originX;
        const dy      = touch.clientY - originY;
        const dist    = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(dist, DEAD);
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;

        thumb.style.transform =
          'translate(calc(-50% + ' + (nx * clamped) + 'px), calc(-50% + ' + (ny * clamped) + 'px))';

        this.joy.angle = Math.atan2(dy, dx);
        this.joy.mag   = Math.min(dist / DEAD, 1);
      }
    }, { passive: false });

    const endJoy = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier !== joyTouchId) continue;
        joyTouchId            = null;
        thumb.style.transform = 'translate(-50%, -50%)';
        base.style.opacity    = '0';
        this.joy.mag          = 0;
        this.joy.active       = false;
      }
    };

    zone.addEventListener('touchend',    endJoy, { passive: false });
    zone.addEventListener('touchcancel', endJoy, { passive: false });
  },

  // ── GAME LOOP ─────────────────────────────────────────────
  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(dt);
    this.composer.render();
    requestAnimationFrame(t => this.loop(t));
  },

  // ── UPDATE ────────────────────────────────────────────────
  update(dt) {
    if (this.runnerActive) {
      this.updateRunner(dt);
      return;
    }

    if (this.voyageActive) {
      this.updateSeaVoyage(dt);
      return;
    }

    if (this.mtnPassActive) {
      this.updateMtnPass(dt);
      return;
    }

    if (this.interactCooldown  > 0) this.interactCooldown  -= dt;
    if (this.gateBlockCooldown > 0) this.gateBlockCooldown -= dt;

    if (!this.dialogueActive && !this.templeTransitioning && !this.minigameActive && !this.choiceActive) {
      this.updatePlayer(dt);
    }

    this.updateCamera(dt);
    this.updateNPCFacing();
    this.updateInteractUI();
    this.updateFollowers(dt);
    this.updatePatrolNPCs(dt);
    this.updateDust(dt);
    this.updateCompass();
    this.updateHintArrow();
  },

  // ── PLAYER MOVEMENT ───────────────────────────────────────
  updatePlayer(dt) {
    const keys = this.keys;
    let dx = 0;
    let dz = 0;

    // Keyboard input (world-space: W=north = -Z, S=south = +Z)
    if (keys['w'] || keys['W'] || keys['ArrowUp'])    dz -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown'])  dz += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft'])  dx -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

    // Joystick input
    if (this.joy.active && this.joy.mag > 0.1) {
      dx += Math.cos(this.joy.angle) * this.joy.mag;
      dz += Math.sin(this.joy.angle) * this.joy.mag;
    }

    // Normalize diagonal
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 1) {
      dx /= len;
      dz /= len;
    }

    const speed = this.player.speed;
    const pos   = this.player.pos;

    // Jump physics
    if (this.player.isJumping) {
      this.player.jumpY   += this.player.jumpVel * dt;
      this.player.jumpVel -= 22 * dt;
      if (this.player.jumpY <= 0) {
        this.player.jumpY   = 0;
        this.player.jumpVel = 0;
        this.player.isJumping = false;
      }
    }

    if (len > 0.01) {
      this.player.moving = true;

      // Try X movement
      const newX = pos.x + dx * speed * dt;
      if (!this.collidesAt(newX, pos.z)) {
        pos.x = newX;
      }

      // Try Z movement
      const newZ = pos.z + dz * speed * dt;
      if (!this.collidesAt(pos.x, newZ)) {
        pos.z = newZ;
      } else if (dz > 0 && newZ > 53.5 && !this.gateUnlocked && this.gateBlockCooldown <= 0) {
        // Player walked into the south gate — show hint
        this.gateBlockCooldown = 4;
        if (!this.hasLetters) {
          this.showNotification('The road is sealed.\nObtain letters from\nthe High Priest first.');
        } else {
          this.showNotification('Show your letters\nto the Gate Guard\nto pass.');
        }
      }

      // Facing angle — smooth rotation
      const targetAngle = Math.atan2(dx, dz);
      let diff = targetAngle - this.player.facingAngle;
      // Wrap to -PI..PI
      while (diff >  Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      this.player.facingAngle += diff * 0.18;
      this.playerGroup.rotation.y = this.player.facingAngle;

      // Walk bob
      this.player.animTime += dt * 8;
      const ty1 = this.getTerrainY(pos.x, pos.z);
      this.playerGroup.position.y = ty1 + Math.abs(Math.sin(this.player.animTime)) * 0.06 + this.player.jumpY;

    } else {
      this.player.moving = false;

      // Breathing idle
      this.player.animTime += dt * 1.5;
      const ty2 = this.getTerrainY(pos.x, pos.z);
      this.playerGroup.position.y = ty2 + Math.sin(this.player.animTime) * 0.012 + this.player.jumpY;
    }

    // Sync group position
    this.playerGroup.position.x = pos.x;
    this.playerGroup.position.z = pos.z;

    // Temple entry / exit transition
    if (!this.templeTransitioning) {
      const px = pos.x, pz = pos.z;
      if (!this.templeInside && pz < -11.5 && pz > -14 && Math.abs(px) < 1.8) {
        this.enterTemple();
      } else if (this.templeInside && pz > -11.5 && Math.abs(px) < 1.3) {
        this.exitTemple();
      }
    }

    // Check for Damascus Road trigger (only after gate guard unlocks it)
    if (this.gateUnlocked && pos.z > 55.8 && !this.damascusRoadActive) {
      this.triggerDamascusRoad();
    }

    // Antioch scene checks
    if (this.antiochActive) {
      this.updateAntiochChecks(pos);
    }

    // Hidden bonus behind the temple — 50 shekels, one time only
    if (!this.templeBackBonusCollected && !this.templeInside && pos.z < -24) {
      this.templeBackBonusCollected = true;
      this.inventory.shekels += 50;
      this.updateInventoryHUD();
      this.showNotification('You found something\nhidden behind the temple...\n+50 shekels!');
    }

    // Damascus Road: encounter trigger mid-road
    if (this.damascusRoadActive && !this.encounterTriggered && pos.z > 185) {
      this.triggerEncounter();
    }

    // Damascus Road: Ananias proximity (restore sight)
    if (this.damascusRoadActive && this.blindActive && !this.sightRestored && pos.z > 307) {
      this.sightRestored = true;
      this.startAnaniasDialogue();
    }
  },

  // ── STATIC-ONLY COLLISION (for follower NPC pathfinding) ──
  collidesAtStatic(x, z) {
    const r = 0.35;
    if (x < -37 || x > 37 || z < -27.5) return true;
    for (const c of WORLD.colliders) {
      if (x - r < c.maxX && x + r > c.minX &&
          z - r < c.maxZ && z + r > c.minZ) return true;
    }
    return false;
  },

  // ── COLLISION ─────────────────────────────────────────────
  collidesAt(x, z) {
    const r = 0.45;

    // World border (sides + north)
    if (x < -37 || x > 37) return true;
    if (z < -27.5) return true;
    // South gate — blocked until guard unlocks it
    if (z > 54.5 && !this.gateUnlocked) return true;

    // AABB scene colliders
    for (const c of WORLD.colliders) {
      if (x - r < c.maxX && x + r > c.minX &&
          z - r < c.maxZ && z + r > c.minZ) {
        return true;
      }
    }

    // NPC bodies (dynamic) — skip recruited followers who move with player
    const nr2 = (r + 0.38) * (r + 0.38);
    for (const id in this.npcObjects) {
      if (this.recruitedNPCs[id]) continue;
      const g  = this.npcObjects[id].group;
      const dx = x - g.position.x;
      const dz = z - g.position.z;
      if (dx * dx + dz * dz < nr2) return true;
    }

    // Sign posts (dynamic)
    const sr2 = (r + 0.1) * (r + 0.1);
    for (const s of this.signObjects) {
      const dx = x - s.group.position.x;
      const dz = z - s.group.position.z;
      if (dx * dx + dz * dz < sr2) return true;
    }

    // Palm tree trunks
    const pr2 = (r + 0.28) * (r + 0.28);
    for (const palm of WORLD.palms) {
      const pdx = x - palm.x;
      const pdz = z - palm.z;
      if (pdx * pdx + pdz * pdz < pr2) return true;
    }

    return false;
  },

  // ── TERRAIN ELEVATION ─────────────────────────────────────
  getTerrainY(x, z) {
    // Grand staircase — walk up automatically (no jump needed)
    if (z < -8.1 && z > -10.75 && Math.abs(x) < 5.6) {
      if (z < -10.15) return 1.10;
      if (z < -9.63)  return 0.88;
      if (z < -9.11)  return 0.66;
      if (z < -8.59)  return 0.44;
      return 0.22;
    }
    // Temple platform surface
    if (z < -10.75 && Math.abs(x) < 11) return 1.2;
    return 0;
  },

  // ── CAMERA ────────────────────────────────────────────────
  updateCamera(dt) {
    const p = this.player.pos;

    // Departure cutscene — cinematic pullback to show assembled company
    if (this.cutsceneActive) {
      this.cutsceneTimer += dt;
      const t = Math.min(this.cutsceneTimer / 2.8, 1.0);
      const ease = t * t * (3 - 2 * t); // smooth step
      const targetX = 0;
      const targetY = 9 + ease * 28;                   // rise: 9 → 37
      const targetZ = p.z + 12 - ease * 22;            // pull north: show company from above
      const k = 0.055;
      this.cam.pos.x += (targetX - this.cam.pos.x) * k;
      this.cam.pos.y += (targetY - this.cam.pos.y) * k;
      this.cam.pos.z += (targetZ - this.cam.pos.z) * k;
      this.camera.position.copy(this.cam.pos);
      this.camera.lookAt(0, 0, p.z - 2);
      return;
    }

    const targetX = p.x;
    const targetY = this.templeInside ? 20 : this.cam.offsetY;
    const targetZ = p.z + (this.templeInside ? 9 : this.cam.offsetZ);

    const k = 0.07;
    this.cam.pos.x += (targetX - this.cam.pos.x) * k;
    this.cam.pos.y += (targetY - this.cam.pos.y) * k;
    this.cam.pos.z += (targetZ - this.cam.pos.z) * k;

    this.camera.position.copy(this.cam.pos);
    this.camera.lookAt(p.x, this.templeInside ? 1.5 : 0.8, p.z - (this.templeInside ? 5 : 1.5));
  },

  // ── NPC FACING ────────────────────────────────────────────
  updateNPCFacing() {
    const px = this.player.pos.x;
    const pz = this.player.pos.z;

    for (const id in this.npcObjects) {
      const obj = this.npcObjects[id];

      // Talking-pair NPCs keep a fixed facing angle
      if (obj.data.staticFacing !== undefined) {
        obj.group.rotation.y = obj.data.staticFacing;
        continue;
      }

      const nx  = obj.group.position.x;
      const nz  = obj.group.position.z;
      const dx  = px - nx;
      const dz  = pz - nz;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 6) {
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - obj.group.rotation.y;
        while (diff >  Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        obj.group.rotation.y += diff * 0.05;
      }
    }
  },

  // ── INTERACT UI ───────────────────────────────────────────
  updateInteractUI() {
    if (this.dialogueActive) {
      this.elInteractPrompt.classList.add('hidden');
      return;
    }

    const nearestNPC  = this.findNearestNPC(3.5);
    const nearestSign = this.findNearestSign(2.5);

    if (nearestNPC) {
      this.elInteractPrompt.textContent = '[E] Talk to ' + nearestNPC.data.name;
      this.elInteractPrompt.classList.remove('hidden');
    } else if (nearestSign) {
      this.elInteractPrompt.textContent = '[E] Read ' + nearestSign.data.label;
      this.elInteractPrompt.classList.remove('hidden');
    } else {
      this.elInteractPrompt.classList.add('hidden');
    }
  },

  // ── FIND NEAREST NPC ──────────────────────────────────────
  findNearestNPC(maxDist) {
    const px = this.player.pos.x;
    const pz = this.player.pos.z;
    let nearest = null;
    let nearestDist = maxDist;

    for (const id in this.npcObjects) {
      // Recruited followers can't be talked to — they're marching with you
      if (this.recruitedNPCs[id]) continue;
      const obj = this.npcObjects[id];
      if (!obj.group.visible) continue; // arrested / hidden NPCs
      const dx  = px - obj.group.position.x;
      const dz  = pz - obj.group.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = obj;
      }
    }

    return nearest;
  },

  // ── FIND NEAREST SIGN ─────────────────────────────────────
  findNearestSign(maxDist) {
    const px = this.player.pos.x;
    const pz = this.player.pos.z;
    let nearest = null;
    let nearestDist = maxDist;

    for (const s of this.signObjects) {
      const dx   = px - s.group.position.x;
      const dz   = pz - s.group.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }

    return nearest;
  },

  // ── INTERACT ──────────────────────────────────────────────
  tryInteract() {
    if (this.minigameActive || this.choiceActive) return;
    if (this.dialogueActive) {
      this.advanceDialogue();
      return;
    }

    if (this.interactCooldown > 0) return;

    // Prefer NPC over sign if both are nearby
    const nearestNPC = this.findNearestNPC(3.5);
    if (nearestNPC) {
      this.interactCooldown = 0.4;
      this.startDialogue(nearestNPC);
      return;
    }

    const nearestSign = this.findNearestSign(2.5);
    if (nearestSign) {
      this.interactCooldown = 0.4;
      // Wrap sign data so it works with the existing dialogue system
      const signAsNPC = {
        group: nearestSign.group,
        data: {
          name: nearestSign.data.label,
          dialogues: [{ speaker: nearestSign.data.label, text: nearestSign.data.text }],
          onComplete: null,
        },
      };
      this.startDialogue(signAsNPC);
    }
  },

  // ── DIALOGUE ──────────────────────────────────────────────
  startDialogue(npcObj) {
    this.currentDialogueNPC = npcObj;
    const id = npcObj.data.id;
    let dialogues = npcObj.data.dialogues;

    if (id === 'gate_guard') {
      const allReady = this.hasLetters && this.companionsRecruited >= 4 && this.horsesAcquired;
      if (allReady && npcObj.data.dialoguesAlt) {
        dialogues = npcObj.data.dialoguesAlt;
      } else if (this.hasLetters && npcObj.data.dialoguesMissing) {
        dialogues = npcObj.data.dialoguesMissing;
      }
    } else if (npcObj.data.onComplete === 'recruit_companion') {
      if (this.recruitedNPCs[id]) {
        dialogues = [{ speaker: npcObj.data.name, text: '"I am ready, Saul. We leave when you give the word."' }];
      } else if (this.hasLetters && npcObj.data.dialoguesAlt) {
        dialogues = npcObj.data.dialoguesAlt;
      }
      // else: soldier mode — use default dialogues
    } else if (id === 'stable_master' && this.horsesAcquired) {
      dialogues = [{ speaker: 'Elias', text: '"Your five horses are in the pen and ready to ride. May God grant you a swift journey to Damascus."' }];
    } else if (id === 'stable_master' && this.inventory.shekels < 15) {
      dialogues = [{ speaker: 'Elias', text: '"Five horses for the Damascus road \u2014 that\'s 15 shekels. Come back when you have the coin. You can earn it making and selling tents."' }];
    } else if (id === 'loom_keeper' && this.inventory.tents > 0 && this.inventory.tentCloth === 0) {
      dialogues = [{ speaker: 'Benjamin', text: '"You already have a tent ready to sell! Take it north to Joseph the Merchant on the main road. He pays 5 shekels a tent."' }];
    } else if (id === 'loom_keeper' && this.inventory.tentCloth === 0) {
      dialogues = [{ speaker: 'Benjamin', text: '"Bring me tent cloth and I will weave it into a fine tent. Find Miriam \u2014 she sells cloth on the main road. 2 shekels a bolt."' }];
    } else if (id === 'joseph_buyer' && this.inventory.tents === 0) {
      dialogues = [{ speaker: 'Joseph', text: '"Do you have any tents to sell? I pay 5 shekels each. Bring me one and we have a deal."' }];
    } else if (id === 'miriam_cloth' && this.purchasedCloth) {
      dialogues = [{ speaker: 'Miriam', text: '"You already have your cloth! Take it south to Benjamin the Weaver in the craftsmen\'s quarter — he will make it into a fine tent."' }];
    } else if (id === 'miriam_cloth' && this.inventory.shekels < 2) {
      dialogues = [{ speaker: 'Miriam', text: '"Tent cloth is 2 shekels a bolt. Come back when you have the coin, friend."' }];
    }

    this.dialogueQueue  = dialogues;
    this.dialogueIndex  = 0;
    this.dialogueActive = true;

    this.elDialogueBox.classList.remove('hidden');
    this.showDialogueLine(0);
  },

  showDialogueLine(index) {
    if (index >= this.dialogueQueue.length) {
      this.endDialogue();
      return;
    }

    const line = this.dialogueQueue[index];
    this.elDialogueSpeaker.textContent = line.speaker;

    // Clear previous
    if (this.typeTimer) {
      clearTimeout(this.typeTimer);
      this.typeTimer = null;
    }
    this.elDialogueText.textContent = '';
    this.dialogueTyping = true;
    this.elDialoguePrompt.style.opacity = '0';

    // Letter-by-letter typing
    const fullText = line.text;
    let charIdx    = 0;

    const typeNext = () => {
      if (charIdx >= fullText.length) {
        this.dialogueTyping = false;
        this.elDialoguePrompt.style.opacity = '';
        return;
      }

      this.elDialogueText.textContent += fullText[charIdx];
      const ch = fullText[charIdx];
      charIdx++;

      // Punctuation pause
      let delay = 22;
      if (ch === '.' || ch === '!' || ch === '?' || ch === '\u2014') delay = 70;
      else if (ch === ',' || ch === ';') delay = 45;

      this.typeTimer = setTimeout(typeNext, delay);
    };

    typeNext();
  },

  advanceDialogue() {
    if (!this.dialogueActive) return;

    if (this.dialogueTyping) {
      // Skip to full text
      if (this.typeTimer) {
        clearTimeout(this.typeTimer);
        this.typeTimer = null;
      }
      const line = this.dialogueQueue[this.dialogueIndex];
      this.elDialogueText.textContent = line.text;
      this.dialogueTyping = false;
      this.elDialoguePrompt.style.opacity = '';
      return;
    }

    // Advance to next line
    this.dialogueIndex++;
    if (this.dialogueIndex >= this.dialogueQueue.length) {
      this.endDialogue();
    } else {
      this.showDialogueLine(this.dialogueIndex);
    }
  },

  endDialogue() {
    if (this.typeTimer) {
      clearTimeout(this.typeTimer);
      this.typeTimer = null;
    }

    this.dialogueActive   = false;
    this.dialogueTyping   = false;

    this.elDialogueBox.classList.add('hidden');
    this.elDialogueText.textContent    = '';
    this.elDialogueSpeaker.textContent = '';

    // Check for completion callback
    if (this.currentDialogueNPC && this.currentDialogueNPC.data.onComplete) {
      const cb  = this.currentDialogueNPC.data.onComplete;
      const nid = this.currentDialogueNPC.data.id;

      if (cb === 'receive_letters') {
        this.startSealingMinigame(() => { this.receiveLetters(); });

      } else if (cb === 'recruit_companion' && !this.recruitedNPCs[nid] && this.hasLetters) {
        this.recruitedNPCs[nid] = true;
        this.companionsRecruited++;
        const trueName = this.currentDialogueNPC.data.trueName || this.currentDialogueNPC.data.name;
        this.showNotification('Companion ' + this.companionsRecruited + '/4 recruited!\n' + trueName + ' will follow you.');
        this.updateQuestProgress();

      } else if (cb === 'offer_cloth') {
        const npcRef = this.currentDialogueNPC;
        const afford3 = this.inventory.shekels >= 6;
        const afford1 = this.inventory.shekels >= 2;
        if (afford3) {
          this.showChoice(
            'Buy tent cloth? (2 shekels per bolt)',
            'Buy 3 bolts (6\u2609)',
            'Buy 1 bolt (2\u2609)',
            () => {
              this.inventory.shekels -= 6;
              this.inventory.tentCloth += 3;
              this.purchasedCloth = true;
              this.updateInventoryHUD();
              this.updateSatchelHUD();
              this.showNotification('3 bolts purchased! (\u22126 shekels)\nBring them to Benjamin the Weaver\nin the craftsmen\'s quarter.');
            },
            () => {
              // Buy just 1
              this.inventory.shekels -= 2;
              this.inventory.tentCloth++;
              this.purchasedCloth = true;
              this.updateInventoryHUD();
              this.updateSatchelHUD();
              this.showNotification('1 bolt purchased! (\u22122 shekels)\nBring it to Benjamin the Weaver\nin the craftsmen\'s quarter.');
            }
          );
        } else if (afford1) {
          this.showChoice(
            'Buy one bolt of tent cloth for 2 shekels?',
            'Buy (2 shekels)',
            'Decline',
            () => {
              this.inventory.shekels -= 2;
              this.inventory.tentCloth++;
              this.purchasedCloth = true;
              this.updateInventoryHUD();
              this.updateSatchelHUD();
              this.showNotification('Tent cloth purchased! (\u22122 shekels)\nBring it to Benjamin the Weaver\nin the craftsmen\'s quarter.');
            },
            () => {
              this.showNotification('Come back when you need cloth.');
            }
          );
        } else {
          this.showNotification('You need at least 2 shekels\nto buy tent cloth.\nMake some coin first!');
        }

      } else if (cb === 'craft_tent') {
        if (this.inventory.tentCloth > 0) {
          this.startWeavingMinigame(
            () => {
              this.inventory.tentCloth--;
              this.inventory.tents++;
              this.updateInventoryHUD();
              this.updateSatchelHUD();
              this.showNotification('Tent crafted!\nSell it to Joseph for 5 shekels.');
            },
            () => {
              this.showNotification('Practice makes perfect!\nSpeak to Benjamin again\nto try the weaving once more.');
            }
          );
        } else {
          this.showNotification('You need tent cloth first!\nBuy some from Miriam.');
        }

      } else if (cb === 'sell_tent') {
        if (this.inventory.tents > 0) {
          const tCount = this.inventory.tents;
          const earned = tCount * 5;
          this.showChoice(
            'Sell ' + tCount + ' tent' + (tCount > 1 ? 's' : '') + ' for ' + earned + ' shekels?',
            'Sell All (' + earned + '\u2609)',
            'Sell 1 (5\u2609)',
            () => {
              this.inventory.shekels += earned;
              this.inventory.tents    = 0;
              this.updateInventoryHUD();
              this.updateSatchelHUD();
              this.showNotification('Sold ' + tCount + ' tent' + (tCount > 1 ? 's' : '') + ' for ' + earned + ' shekels!\nTotal: ' + this.inventory.shekels + ' shekels.');
            },
            () => {
              this.inventory.tents--;
              this.inventory.shekels += 5;
              this.updateInventoryHUD();
              this.updateSatchelHUD();
              this.showNotification('Tent sold for 5 shekels!\nTotal: ' + this.inventory.shekels + ' shekels.');
            }
          );
        }

      } else if (cb === 'buy_horses') {
        if (!this.horsesAcquired && this.inventory.shekels >= 15) {
          this.showChoice(
            'Buy 5 horses for the Damascus road — 15 shekels?',
            'Buy (15 shekels)',
            'Not yet',
            () => {
              this.inventory.shekels -= 15;
              this.horsesAcquired = true;
              this.updateInventoryHUD();
              this.updateQuestProgress();
              this.buildHorses();
            },
            () => {
              this.showNotification('Come back when you are ready\nto purchase the horses.');
            }
          );
        } else if (!this.horsesAcquired) {
          this.showNotification('Not enough shekels!\nNeed 15 to buy 5 horses.\nMake and sell tents to earn coin.');
        }

      } else if (cb === 'believer_choice') {
        const npcRef = this.currentDialogueNPC;
        this.showChoice(
          'What will you do?',
          'Pass them by',
          'Arrest them',
          () => {
            // Turn the NPC away — they slip into the shadows
            if (npcRef && this.npcObjects[npcRef.data.id]) {
              this.npcObjects[npcRef.data.id].group.rotation.y = Math.PI;
            }
            this.showNotification('You walk past in silence.\nTheir eyes never leave you\nas you turn the corner.');
          },
          () => {
            // NPC disappears — taken into custody
            if (npcRef && this.npcObjects[npcRef.data.id]) {
              this.npcObjects[npcRef.data.id].group.visible = false;
            }
            this.showArrestCinematic();
          }
        );

      } else if (cb === 'restore_sight') {
        this.restoreSight();
        // Show level complete after a moment
        setTimeout(() => this.showDamascusComplete(), 2000);

      } else if (cb === 'gate_open') {
        const allReady = this.hasLetters && this.companionsRecruited >= 4 && this.horsesAcquired;
        if (allReady) {
          this.gateUnlocked = true;
          if (this.npcObjects['gate_guard']) {
            this.npcObjects['gate_guard'].group.position.x = 3.5;
          }
          this.elQuestText.textContent    = 'Head south \u2014 the road to Damascus awaits';
          this.elScriptureRef.textContent = 'Acts 9:3';
          this.showDepartureScene();
        }

      } else {
        // Journey 1 callbacks
        this._handleJ1DialogueComplete(cb, nid);
      }
    }

    this.currentDialogueNPC = null;
    this.interactCooldown   = 0.5;
  },

  // ── DISMISS DIALOGUE (no callback — e.g. Esc to decline) ──
  dismissDialogue() {
    if (!this.dialogueActive) return;
    if (this.typeTimer) { clearTimeout(this.typeTimer); this.typeTimer = null; }
    this.dialogueActive   = false;
    this.dialogueTyping   = false;
    this.elDialogueBox.classList.add('hidden');
    this.elDialogueText.textContent    = '';
    this.elDialogueSpeaker.textContent = '';
    this.currentDialogueNPC = null;
    this.interactCooldown   = 0.5;
  },

  // ── TEMPLE TRANSITIONS ────────────────────────────────────
  _makeTransitionOverlay() {
    const ov = document.createElement('div');
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:50',
      'background:rgba(0,0,0,0)', 'pointer-events:none',
      'transition:background 0.32s ease',
    ].join(';');
    document.body.appendChild(ov);
    return ov;
  },

  enterTemple() {
    this.templeTransitioning = true;
    this.templeInside        = true;

    const ov = this._makeTransitionOverlay();
    requestAnimationFrame(() => { ov.style.background = 'rgba(0,0,0,1)'; });

    setTimeout(() => {
      // Teleport player inside entrance
      this.player.pos.set(0, 0, -15);
      this.playerGroup.position.set(0, 0, -15);
      // Snap camera overhead to avoid lerp glitch
      this.cam.pos.set(0, 20, -15 + 9);

      // Add warm torch light inside temple
      if (!this.templeLight) {
        const tl = new THREE.PointLight(0xffdd88, 3.0, 28);
        tl.position.set(0, 5.5, -18);
        this.scene.add(tl);
        this.templeLight = tl;
      }

      document.getElementById('location-name').textContent = 'Holy Temple';
      document.getElementById('scripture-ref').textContent = 'Acts 9:1';

      ov.style.background = 'rgba(0,0,0,0)';
      setTimeout(() => { ov.remove(); this.templeTransitioning = false; }, 340);
    }, 340);
  },

  exitTemple() {
    this.templeTransitioning = true;
    this.templeInside        = false;

    const ov = this._makeTransitionOverlay();
    requestAnimationFrame(() => { ov.style.background = 'rgba(0,0,0,1)'; });

    setTimeout(() => {
      // Remove temple light
      if (this.templeLight) { this.scene.remove(this.templeLight); this.templeLight = null; }

      // Teleport player just outside temple
      this.player.pos.set(0, 0, -9);
      this.playerGroup.position.set(0, 0, -9);
      this.cam.pos.set(0, 9, -9 + 12);

      document.getElementById('location-name').textContent = 'Jerusalem';
      document.getElementById('scripture-ref').textContent = 'Acts 9:1';

      ov.style.background = 'rgba(0,0,0,0)';
      setTimeout(() => { ov.remove(); this.templeTransitioning = false; }, 340);
    }, 340);
  },

  // ── RECEIVE LETTERS ───────────────────────────────────────
  // ── JUMP ──────────────────────────────────────────────────
  tryJump() {
    if (this.player.isJumping || this.dialogueActive || this.templeTransitioning) return;
    this.player.isJumping = true;
    this.player.jumpVel   = 7;
  },

  // ── RECEIVE LETTERS ───────────────────────────────────────
  receiveLetters() {
    this.hasLetters = true;

    this.elQuestText.textContent    = 'Find 4 companions (0/4) & buy horses';
    this.elScriptureRef.textContent = 'Acts 9:2';

    this.updateInventoryHUD();
    this.updateSatchelHUD();

    this.showQuestPopup(
      'Prepare for the Road',
      'You carry the sealed letters of Caiaphas. Now recruit 4 companions for the journey and purchase 5 horses from Elias the Stable Master.',
      '— Acts 9:2'
    );
  },

  // ── QUEST PROGRESS ────────────────────────────────────────
  updateQuestProgress() {
    if (!this.hasLetters) return;
    const c = this.companionsRecruited;
    const h = this.horsesAcquired;
    if (c >= 4 && h) {
      this.elQuestText.textContent    = 'Show letters to the Gate Guard';
      this.elScriptureRef.textContent = 'Acts 9:2';
      if (!this.questReadyPopupShown) {
        this.questReadyPopupShown = true;
        setTimeout(() => {
          this.showQuestPopup(
            'Company Assembled',
            'Your companions are recruited and your horses stand ready. Present your sealed letters to the Gate Guard at the south wall.',
            '— Acts 9:2'
          );
        }, 1200);
      }
    } else if (!h && c < 4) {
      this.elQuestText.textContent = 'Find companions (' + c + '/4) & buy horses';
    } else if (!h) {
      this.elQuestText.textContent = 'Buy 5 horses from Elias the Stable Master';
    } else {
      this.elQuestText.textContent = 'Find companions (' + c + '/4) for the journey';
    }
  },

  // ── INVENTORY HUD ─────────────────────────────────────────
  updateInventoryHUD() {
    const el = document.getElementById('shekel-count');
    if (el) el.textContent = this.inventory.shekels;
  },

  // ── OPENING TITLE CARD ────────────────────────────────────
  showOpeningCard() {
    const ov = document.createElement('div');
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:200',
      'background:#080500',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'font-family:Cinzel,serif', 'text-align:center',
      'padding:36px 28px', 'opacity:0',
      'transition:opacity 1.2s ease', 'cursor:pointer',
    ].join(';');

    const title = document.createElement('div');
    title.textContent = "Paul\u2019s Journeys";
    title.style.cssText = 'color:#c9a84c;font-size:clamp(2rem,7vw,3rem);font-weight:700;letter-spacing:0.15em;text-shadow:0 0 30px rgba(201,168,76,0.5);margin-bottom:5px;';
    ov.appendChild(title);

    const sub = document.createElement('div');
    sub.textContent = 'Jerusalem  \u2022  34 AD';
    sub.style.cssText = 'color:#7a6030;font-size:clamp(0.75rem,2vw,0.9rem);letter-spacing:0.28em;margin-bottom:34px;';
    ov.appendChild(sub);

    const verse = document.createElement('div');
    verse.textContent = '\u201cAnd Saul, yet breathing out threatenings and slaughter against the disciples of the Lord, went unto the high priest, and desired of him letters to Damascus to the synagogues, that if he found any of this way, whether they were men or women, he might bring them bound unto Jerusalem.\u201d';
    verse.style.cssText = 'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#c8b880;font-size:clamp(0.92rem,2.4vw,1.15rem);max-width:500px;line-height:1.8;margin-bottom:10px;';
    ov.appendChild(verse);

    const ref = document.createElement('div');
    ref.textContent = '\u2014 Acts 9:1\u20132';
    ref.style.cssText = 'color:#7a6030;font-family:Cinzel,serif;font-size:0.8rem;letter-spacing:0.1em;margin-bottom:30px;';
    ov.appendChild(ref);

    const ctx = document.createElement('div');
    ctx.textContent = 'You are Saul of Tarsus. Receive letters from the High Priest, recruit companions, and prepare for the road to Damascus.';
    ctx.style.cssText = 'color:#a09060;font-family:Crimson Text,Georgia,serif;font-size:clamp(0.82rem,2vw,0.98rem);max-width:400px;line-height:1.65;margin-bottom:38px;';
    ov.appendChild(ctx);

    const tap = document.createElement('div');
    tap.textContent = 'TAP TO BEGIN';
    tap.style.cssText = 'color:#c9a84c;font-size:0.72rem;letter-spacing:0.22em;animation:pulse 2s ease-in-out infinite;';
    ov.appendChild(tap);

    document.body.appendChild(ov);
    requestAnimationFrame(() => { ov.style.opacity = '1'; });

    let dismissed = false;
    let autoTimer = null;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(autoTimer);
      ov.style.opacity = '0';
      setTimeout(() => {
        if (ov.parentNode) ov.remove();
        this.showQuestPopup(
          'Find the High Priest',
          'Head north through the market to the Holy Temple. Speak with Caiaphas, the High Priest, and receive your letters of passage.',
          '— Acts 9:1'
        );
      }, 1200);
      ov.removeEventListener('click', dismiss);
      ov.removeEventListener('touchend', dismiss);
    };
    ov.addEventListener('click', dismiss);
    ov.addEventListener('touchend', dismiss);
    autoTimer = setTimeout(dismiss, 10000); // auto-dismiss after 10s
  },

  // ── QUEST HINT ARROW ──────────────────────────────────────
  showHintArrow() {
    const el = document.getElementById('quest-arrow');
    if (el) el.classList.remove('hidden');
    this.hintActive = true;
  },

  updateHintArrow() {
    if (!this.hintActive) return;
    // Dismiss once player heads north past z:3 or after getting letters
    if (this.player.pos.z < 3 || this.hasLetters) {
      const el = document.getElementById('quest-arrow');
      if (el) el.classList.add('hidden');
      this.hintActive = false;
    }
  },

  // ── DEPARTURE CINEMATIC ───────────────────────────────────
  showDepartureScene() {
    // Start camera pullback
    this.cutsceneActive = true;
    this.cutsceneTimer  = 0;

    // Overlay
    const ov = document.createElement('div');
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:90',
      'background:rgba(0,0,0,0)',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'pointer-events:none', 'text-align:center',
      'padding:40px', 'transition:background 1.2s ease',
    ].join(';');
    document.body.appendChild(ov);
    setTimeout(() => { ov.style.background = 'rgba(0,0,0,0.55)'; }, 400);

    const mkText = (txt, css) => {
      const d = document.createElement('div');
      d.innerHTML = txt;
      d.style.cssText = css + 'opacity:0;transition:opacity 1.3s ease;';
      ov.appendChild(d);
      return d;
    };

    const t1 = mkText('Your Company is Assembled',
      'font-family:Cinzel,serif;color:#c9a84c;font-size:clamp(1.1rem,4vw,1.9rem);font-weight:700;letter-spacing:0.1em;text-shadow:0 0 20px rgba(201,168,76,0.5);margin-bottom:20px;');

    const t2 = mkText('\u201cAnd desired of him letters to Damascus to the synagogues\u2026\u201d<br><em style="font-size:0.85em;color:#9a8050">\u2014 Acts 9:2</em>',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#d0c090;font-size:clamp(0.88rem,2.4vw,1.1rem);max-width:460px;line-height:1.8;margin-bottom:18px;');

    const t3 = mkText('Head south \u2014 the road to Damascus awaits.',
      'font-family:Crimson Text,Georgia,serif;color:#a09060;font-size:clamp(0.82rem,2vw,0.98rem);');

    setTimeout(() => { t1.style.opacity = '1'; }, 700);
    setTimeout(() => { t2.style.opacity = '1'; t3.style.opacity = '1'; }, 1700);

    // Fade out and restore camera
    setTimeout(() => {
      ov.style.transition = 'background 1.5s ease, opacity 1.5s ease';
      ov.style.background = 'rgba(0,0,0,0)';
      ov.style.opacity    = '0';
      this.cutsceneActive = false;
      setTimeout(() => {
        if (ov.parentNode) ov.remove();
        this.damascusTriggered = false;
        this.triggerDamascusRoad();
      }, 1500);
    }, 5500);
  },

  // ── NOTIFICATION ──────────────────────────────────────────
  showNotification(text) {
    this.elNotifText.textContent = text;
    this.elNotification.classList.remove('hidden');

    // Hide after 3.5s
    setTimeout(() => {
      this.elNotification.classList.add('hidden');
    }, 3500);
  },

  // ── QUEST POPUP ───────────────────────────────────────────
  showQuestPopup(title, body, verse) {
    this.dialogueActive = true;
    const popup = document.getElementById('quest-popup');
    document.getElementById('qp-title').textContent = title;
    document.getElementById('qp-body').textContent  = body;
    document.getElementById('qp-verse').textContent = verse || '';
    popup.classList.remove('hidden');
    const dismiss = () => {
      popup.classList.add('hidden');
      this.dialogueActive = false;
    };
    document.getElementById('qp-dismiss').onclick = dismiss;
  },

  // ── ARREST CINEMATIC ──────────────────────────────────────
  showArrestCinematic() {
    this.dialogueActive = true;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;transition:background 0.65s;pointer-events:none;text-align:center;';
    const verse = document.createElement('div');
    verse.style.cssText = 'font-family:Crimson Text,Georgia,serif;font-size:clamp(1rem,3vw,1.2rem);font-style:italic;color:rgba(200,170,100,0);line-height:1.85;max-width:420px;transition:color 0.9s;';
    verse.innerHTML = '\u201cAs for Saul, he made havoc of the church,<br>entering into every house, and haling men<br>and women committed them to prison.\u201d';
    const ref = document.createElement('div');
    ref.style.cssText = 'font-family:Cinzel,serif;font-size:0.68rem;letter-spacing:0.18em;color:rgba(150,120,60,0);margin-top:16px;transition:color 0.9s 0.25s;';
    ref.textContent = '\u2014 ACTS 8:3';
    ov.appendChild(verse);
    ov.appendChild(ref);
    document.body.appendChild(ov);
    requestAnimationFrame(() => {
      ov.style.background = 'rgba(0,0,0,0.92)';
      verse.style.color   = 'rgba(200,170,100,1)';
      ref.style.color     = 'rgba(150,120,60,1)';
    });
    setTimeout(() => {
      ov.style.transition = 'background 1.1s, opacity 1.1s';
      ov.style.opacity    = '0';
      setTimeout(() => { ov.remove(); this.dialogueActive = false; }, 1100);
    }, 3800);
  },

  // ── AMBIENT SOUND ─────────────────────────────────────────
  initAmbientSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      this.ambientCtx = ctx;

      // 3-second white noise buffer
      const sr  = ctx.sampleRate;
      const len = sr * 3;
      const buf = ctx.createBuffer(1, len, sr);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      // Crowd murmur — bandpass noise
      const crowd = ctx.createBufferSource();
      crowd.buffer = buf; crowd.loop = true;
      const crowdBP = ctx.createBiquadFilter();
      crowdBP.type = 'bandpass'; crowdBP.frequency.value = 380; crowdBP.Q.value = 0.32;
      const crowdGain = ctx.createGain(); crowdGain.gain.value = 0.062;
      crowd.connect(crowdBP); crowdBP.connect(crowdGain); crowdGain.connect(ctx.destination);
      crowd.start();

      // Breeze — lowpass noise with slow LFO swell
      const wind = ctx.createBufferSource();
      wind.buffer = buf; wind.loop = true; wind.playbackRate.value = 0.55;
      const windLP = ctx.createBiquadFilter();
      windLP.type = 'lowpass'; windLP.frequency.value = 155;
      const windGain = ctx.createGain(); windGain.gain.value = 0.038;
      wind.connect(windLP); windLP.connect(windGain); windGain.connect(ctx.destination);
      wind.start(ctx.currentTime + 1.0);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine'; lfo.frequency.value = 0.07;
      const lfoAmp = ctx.createGain(); lfoAmp.gain.value = 0.02;
      lfo.connect(lfoAmp); lfoAmp.connect(windGain.gain);
      lfo.start();
    } catch (e) { /* audio unavailable */ }
  },

  stopAmbientSound() {
    if (this.ambientCtx) { this.ambientCtx.close(); this.ambientCtx = null; }
  },

  // ── RUNNER: BUILD INITIAL ROAD SEGMENT ────────────────────
  buildRunnerStart() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0xb09070, roughness: 0.95 });
    const dustMat = new THREE.MeshStandardMaterial({ color: 0xc8a870, roughness: 1.0 });
    const hillMat = new THREE.MeshStandardMaterial({ color: 0xa09060, roughness: 1.0 });

    // Wide ground plane
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 400), dustMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 205);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Road strip (3 lanes = 7.5 wide, add some shoulder)
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 400), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 205);
    this.scene.add(road);

    // Low rolling hills in background
    [-18, 18].forEach(hx => {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(10, 8, 5), hillMat);
      hill.position.set(hx, -7, 60);
      hill.scale.y = 0.4;
      this.scene.add(hill);
      const hill2 = new THREE.Mesh(new THREE.SphereGeometry(12, 8, 5), hillMat);
      hill2.position.set(hx * 1.3, -8, 130);
      hill2.scale.y = 0.35;
      this.scene.add(hill2);
    });

    // Pre-spawn first 80 units of content
    while (this.runnerNextZ < 80) this.spawnRunnerChunk();
  },

  // ── RUNNER: SPAWN CONTENT CHUNK ───────────────────────────
  spawnRunnerChunk() {
    const z    = this.runnerNextZ;
    const time = this.runnerTime;

    // Decorative side rocks every chunk
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x887060, roughness: 0.95 });
    [8, -8].forEach(rx => {
      const s = 0.4 + Math.random() * 0.9;
      const r = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.7, s), rockMat);
      r.position.set(rx + (Math.random() - 0.5) * 2, s * 0.35, z + Math.random() * 10);
      this.scene.add(r);
      this.runnerRoadMeshes.push({ mesh: r, z: r.position.z });
    });

    // Obstacle pattern based on elapsed time
    const phase = time < 35 ? 0 : time < 75 ? 1 : 2;
    this.spawnObstaclePattern(z, phase);

    // Scatter shekels — reward for safe gaps
    if (Math.random() < 0.42) {
      const cLane = Math.floor(Math.random() * 3);
      const arcZ  = z + 3 + Math.random() * 4;
      if (Math.random() < 0.30) {
        // Coin arc: 5 coins in a curve — jump to collect
        const arcYs = [0.58, 1.4, 2.2, 1.4, 0.58];
        for (let ai = 0; ai < 5; ai++) {
          this.spawnCoin(cLane, arcZ + ai * 1.5, arcYs[ai]);
        }
      } else {
        this.spawnCoin(cLane, arcZ);
        if (Math.random() < 0.35) this.spawnCoin(cLane, z + 9 + Math.random() * 3);
      }
    }

    // Rare power-up coins (~15% per chunk)
    if (Math.random() < 0.15) {
      const puLane = Math.floor(Math.random() * 3);
      const puZ    = z + 6 + Math.random() * 8;
      this.spawnPowerup(puLane, puZ);
    }

    this.runnerNextZ += 12 + Math.random() * 6;
  },

  // ── RUNNER: OBSTACLE PATTERNS ─────────────────────────────
  spawnObstaclePattern(z, phase) {
    const r  = Math.random();
    const rs = () => (Math.random() < 0.5 ? 0 : 2); // side lane only (left or right)
    const rl = () => Math.floor(Math.random() * 3);  // any lane

    if (phase === 0) {
      // Easy: ~70% side-lane only, ~15% center, ~15% open
      // Player can comfortably stay center most of the time
      if      (r < 0.12) this.spawnObs('dune',   rs(), z);   // side only
      else if (r < 0.27) this.spawnObs('rock',   rs(), z);   // side only
      else if (r < 0.40) this.spawnObs('thorn',  rs(), z);   // side only
      else if (r < 0.52) this.spawnObs('person', rs(), z);   // side only
      else if (r < 0.62) this.spawnObs('camel',  rs(), z);   // side only
      else if (r < 0.70) this.spawnObs('log',    rs(), z);   // side only
      else if (r < 0.78) this.spawnObs('rock',   1,    z);   // center (must dodge)
      else if (r < 0.84) this.spawnObs('person', 1,    z);   // center (must dodge)
      // else open road — 16% chance

    } else if (phase === 1) {
      // Medium: mix of "block sides → center is escape" and single-lane
      if      (r < 0.10) { this.spawnObs('rock',    0, z); this.spawnObs('rock',    2, z); } // sides blocked, center open
      else if (r < 0.20) { this.spawnObs('thorn',   0, z); this.spawnObs('thorn',   2, z); } // sides blocked
      else if (r < 0.30) { this.spawnObs('camel',   0, z); this.spawnObs('rock',    2, z); } // sides blocked
      else if (r < 0.40) { this.spawnObs('log',     0, z); this.spawnObs('soldier', 2, z); } // sides blocked
      else if (r < 0.50) this.spawnObs('soldier',  rs(), z);                                 // side only
      else if (r < 0.58) this.spawnObs('camel',    rs(), z);                                 // side only
      else if (r < 0.65) this.spawnObs('pillar',   rs(), z);                                 // side only
      else if (r < 0.72) this.spawnObs('boulder',  rs(), z);                                 // side only
      else if (r < 0.79) this.spawnObs('rock',      1,   z);                                 // center (dodge)
      else if (r < 0.85) { this.spawnObs('cart', rs(), z); this.spawnObs('thorn', rs(), z + 8); } // staggered sides
      else if (r < 0.93) this.spawnObs('gap', 1, z);                                         // jump obstacle
      else this.spawnObs('dune', rs(), z);

    } else {
      // Hard: mostly two-lane blockages leaving exactly one lane; center is often the escape
      if      (r < 0.12) { this.spawnObs('rock',    0, z); this.spawnObs('rock',    2, z); } // center open
      else if (r < 0.22) { this.spawnObs('soldier', 0, z); this.spawnObs('camel',   2, z); } // center open
      else if (r < 0.32) { this.spawnObs('soldier', 2, z); this.spawnObs('camel',   0, z); } // center open
      else if (r < 0.42) { this.spawnObs('cart',    0, z); this.spawnObs('soldier', 2, z); } // center open
      else if (r < 0.50) { this.spawnObs('rock',    0, z); this.spawnObs('thorn',   2, z); } // center open
      else if (r < 0.58) { this.spawnObs('camel',   1, z); this.spawnObs('rock',    rs(), z + 8); } // center blocked then side
      else if (r < 0.65) { this.spawnObs('pillar',  0, z); this.spawnObs('camel',   2, z + 9); }   // center open both
      else if (r < 0.72) { this.spawnObs('log',     0, z); this.spawnObs('log',     2, z); }        // center open
      else if (r < 0.79) this.spawnObs('boulder',  rs(), z);
      else if (r < 0.86) { this.spawnObs('cart',    rs(), z); this.spawnObs('rock',  rl(), z + 6); }
      else if (r < 0.94) this.spawnObs('gap', 1, z);
      else { this.spawnObs('dune', rs(), z); this.spawnObs('soldier', rs(), z + 10); }
    }
  },

  // ── RUNNER: SPAWN SINGLE OBSTACLE ─────────────────────────
  spawnObs(type, lane, z) {
    const lx = this.runnerLaneX[lane];
    let mesh;

    if (type === 'rock') {
      const s = 0.7 + Math.random() * 0.4;
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(s * 1.6, s * 0.55, s * 1.2),
        new THREE.MeshStandardMaterial({ color: 0x807060, roughness: 0.95 })
      );
      mesh.position.set(lx, s * 0.28, z);
      mesh._clearJumpY = 0.35;   // player needs jumpY > this to clear

    } else if (type === 'log') {
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 2.2, 7),
        new THREE.MeshStandardMaterial({ color: 0x7a5a30, roughness: 0.95 })
      );
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(lx, 0.22, z);
      mesh._clearJumpY = 0.38;

    } else if (type === 'person') {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.2, 7),
        new THREE.MeshStandardMaterial({ color: 0x506878, roughness: 0.9 }));
      body.position.y = 0.6;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 6),
        new THREE.MeshStandardMaterial({ color: 0xc09060, roughness: 0.85 }));
      head.position.y = 1.35;
      g.add(body); g.add(head);
      g.position.set(lx, 0, z);
      mesh = g;
      mesh._clearJumpY = 999; // can't jump over

    } else if (type === 'soldier') {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.3, 7),
        new THREE.MeshStandardMaterial({ color: 0x7a1818, roughness: 0.8 }));
      body.position.y = 0.65;
      const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.32, 7),
        new THREE.MeshStandardMaterial({ color: 0xd4a830, roughness: 0.5, metalness: 0.4 }));
      helm.position.y = 1.55;
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 5),
        new THREE.MeshStandardMaterial({ color: 0x8a6a30 }));
      spear.position.set(0.4, 1.2, 0);
      g.add(body); g.add(helm); g.add(spear);
      g.position.set(lx, 0, z);
      mesh = g;
      mesh._clearJumpY = 999;

    } else if (type === 'camel') {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xc49050, roughness: 0.9 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 1.5, 7), mat);
      body.rotation.z = Math.PI / 2; body.position.set(0, 0.98, 0);
      const hump = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), mat.clone());
      hump.scale.y = 0.75; hump.position.set(0.1, 1.52, 0);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.7, 6), mat.clone());
      neck.rotation.z = -0.45; neck.position.set(0.82, 1.54, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.22), mat.clone());
      head.position.set(1.26, 1.87, 0);
      [[-0.45,-0.18],[-0.45,0.18],[0.38,-0.18],[0.38,0.18]].forEach(([lx_,lz_]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.92, 5), mat.clone());
        leg.position.set(lx_, 0.46, lz_); g.add(leg);
      });
      g.add(body); g.add(hump); g.add(neck); g.add(head);
      g.position.set(lx, 0, z); mesh = g;
      mesh._clearJumpY = 999;

    } else if (type === 'cart') {
      const g = new THREE.Group();
      const wmat = new THREE.MeshStandardMaterial({ color: 0x8a6030, roughness: 0.9 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.44, 0.92), wmat);
      box.position.y = 0.82;
      [-0.56, 0.56].forEach(wx => {
        const wh = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.065, 5, 8),
          new THREE.MeshStandardMaterial({ color: 0x5a3818, roughness: 0.9 }));
        wh.rotation.y = Math.PI / 2; wh.position.set(wx, 0.36, 0); g.add(wh);
      });
      g.add(box); g.position.set(lx, 0, z); mesh = g;
      mesh._clearJumpY = 999;

    } else if (type === 'thorn') {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0x627040, roughness: 1.0 });
      [[0,0.17,0,1,1,1],[0.28,0.14,0.12,0.78,0.85,0.7],[-0.22,0.13,-0.08,0.7,0.8,0.65]].forEach(([x,y,zz,sx,sy,sz]) => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.38, 6, 4), mat.clone());
        b.scale.set(sx, sy * 0.38, sz); b.position.set(x, y, zz); g.add(b);
      });
      g.position.set(lx, 0, z); mesh = g;
      mesh._clearJumpY = 0.22;

    } else if (type === 'pillar') {
      // Fallen stone column — needs a solid jump to clear
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 2.5, 9),
        new THREE.MeshStandardMaterial({ color: 0xb0a888, roughness: 0.85 })
      );
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(lx, 0.34, z);
      mesh._clearJumpY = 0.55;

    } else if (type === 'gap') {
      // Full-road gap — spans all three lanes, must jump to cross
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(5.8, 0.08, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x160a02, roughness: 1.0 })
      );
      mesh.position.set(0, 0.02, z);
      mesh._isFullGap  = true;
      mesh._clearJumpY = 0.30;

    } else if (type === 'dune') {
      // Sand dune — can't jump over, must dodge; slows Paul on contact
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0xd4a855, roughness: 1.0 })
      );
      mesh.scale.set(1, 0.45, 1.2);
      mesh.position.set(lx, 0, z);
      mesh._clearJumpY = 999;  // can't jump; handled separately in collision

    } else { // boulder
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 7, 6),
        new THREE.MeshStandardMaterial({ color: 0x706858, roughness: 0.95 })
      );
      mesh.scale.y = 0.7;
      mesh.position.set(lx, 0.52, z);
      mesh._clearJumpY = 999;
    }

    mesh.castShadow = true;
    this.scene.add(mesh);
    this.runnerObstacles.push({ mesh, laneX: lx, z, type });
  },

  // ── RUNNER: SPAWN SHEKEL COIN ──────────────────────────────
  spawnCoin(lane, z, y) {
    const lx   = this.runnerLaneX[lane];
    const coinY = (y !== undefined) ? y : 0.58;
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.21, 0.07, 10),
      new THREE.MeshStandardMaterial({ color: 0xf5c018, roughness: 0.2, metalness: 0.65, emissive: 0xc09010, emissiveIntensity: 0.45 })
    );
    coin.rotation.x = Math.PI / 2;   // lie flat like a coin
    coin.position.set(lx, coinY, z);
    this.scene.add(coin);
    this.runnerCoins.push({ mesh: coin, laneX: lx, z });
  },

  // ── RUNNER: SPAWN POWER-UP COIN ────────────────────────────
  spawnPowerup(lane, z) {
    const lx  = this.runnerLaneX[lane];
    const isStar = Math.random() < 0.5;
    const mat = isStar
      ? new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaaaff, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.5 })
      : new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.4 });
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.09, 10), mat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(lx, 0.9, z);
    this.scene.add(coin);
    this.runnerCoins.push({ mesh: coin, laneX: lx, z, powerup: isStar ? 'star' : 'double' });
  },

  // ── RUNNER: MAIN UPDATE ────────────────────────────────────
  updateRunner(dt) {
    if (this.dialogueActive || this.runnerFinished) {
      // Still render camera
      this.updateRunnerCamera(dt);
      return;
    }

    // ── Timer & speed ramp
    this.runnerTime += dt;
    const pct = Math.min(this.runnerTime / this.runnerTimeLimit, 1.0);
    const baseSpeed = 8 + pct * 9;  // 8 → 17 units/sec over 2 min
    const slowMult  = (this.runnerSlowed > 0) ? 0.7 : 1.0;
    this.runnerSpeed = baseSpeed * slowMult;

    // ── Move player forward
    const pz = this.player.pos.z + this.runnerSpeed * dt;
    this.player.pos.z = pz;

    // ── Lane interpolation (smooth slide)
    const targetX = this.runnerLaneX[this.runnerTargetLane];
    this.player.pos.x += (targetX - this.player.pos.x) * Math.min(10 * dt, 1);

    // ── Jump physics
    if (this.runnerJumping) {
      this.runnerJumpVel -= 30 * dt;
      this.runnerJumpY  += this.runnerJumpVel * dt;
      if (this.runnerJumpY <= 0) {
        this.runnerJumpY   = 0;
        this.runnerJumpVel = 0;
        this.runnerJumping = false;
      }
    }

    // Apply slow effect cooldown
    if (this.runnerSlowed > 0) {
      this.runnerSlowed -= dt;
    }

    // Apply to mesh
    this.playerGroup.position.x = this.player.pos.x;
    this.playerGroup.position.z = this.player.pos.z;
    this.playerGroup.position.y = this.runnerJumpY;
    this.playerGroup.rotation.y = 0; // Paul's nose faces +Z naturally — no flip needed

    // ── Galloping horse leg animation
    if (this.runnerHorse) {
      const legSin = Math.sin(this.runnerTime * 12);
      // Legs are first 4 children of runnerHorse (front-left, front-right, back-left, back-right)
      for (let li = 0; li < 4; li++) {
        const leg = this.runnerHorse.children[li];
        if (leg) {
          // Alternating pairs: 0,3 together vs 1,2 together
          const phase = (li === 0 || li === 3) ? legSin : -legSin;
          leg.position.y = 0.29 + phase * 0.12;
        }
      }
    }

    // ── Dust particles behind horse
    if (this.runnerDustParticles && this.runnerDustParticles.length) {
      // Emit 1-2 particles per frame
      const emitCount = Math.random() < 0.5 ? 1 : 2;
      let emitted = 0;
      for (const p of this.runnerDustParticles) {
        if (emitted >= emitCount) break;
        if (!p.visible) {
          p.visible = true;
          p.position.set(
            this.player.pos.x + (Math.random() - 0.5) * 0.6,
            0.1 + Math.random() * 0.3,
            this.player.pos.z - 0.8
          );
          p.vel.set(
            (Math.random() - 0.5) * 3.0,
            0.5 + Math.random() * 1.5,
            -(2 + Math.random() * 3)
          );
          const lifespan = 0.4 + Math.random() * 0.3;
          p.life    = lifespan;
          p.maxLife = lifespan;
          emitted++;
        }
      }
      // Update all active particles
      for (const p of this.runnerDustParticles) {
        if (!p.visible) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.visible = false;
          continue;
        }
        p.position.x += p.vel.x * dt;
        p.position.y += p.vel.y * dt;
        p.position.z += p.vel.z * dt;
        const t = p.life / p.maxLife;
        p.material.opacity = 0.7 * t;
        const sc = t * 0.8;
        p.scale.setScalar(sc > 0.05 ? sc : 0.05);
      }
    }

    // ── Camera
    this.updateRunnerCamera(dt);

    // ── Invincibility cooldown
    if (this.runnerInvincible > 0) this.runnerInvincible -= dt;

    // ── Double coin timer
    if (this.runnerDoubleCoin > 0) this.runnerDoubleCoin -= dt;

    // ── Spawn content ahead
    while (this.runnerNextZ < pz + 90) this.spawnRunnerChunk();

    // ── Despawn obstacles + road deco behind player
    this.runnerObstacles = this.runnerObstacles.filter(o => {
      if (o.z < pz - 15) {
        this.scene.remove(o.mesh);
        return false;
      }
      return true;
    });
    this.runnerRoadMeshes = this.runnerRoadMeshes.filter(o => {
      if (o.z < pz - 15) {
        this.scene.remove(o.mesh);
        return false;
      }
      return true;
    });

    // ── Collect / despawn coins
    this.runnerCoins = this.runnerCoins.filter(c => {
      if (c.z < pz - 10) { this.scene.remove(c.mesh); return false; }
      if (Math.abs(pz - c.z) < 0.85 && Math.abs(this.player.pos.x - c.laneX) < 0.95) {
        this.scene.remove(c.mesh);
        // Power-up handling
        if (c.powerup === 'star') {
          this.runnerInvincible = 5.0;
          this.showRunnerPowerupMsg('INVINCIBLE!');
        } else if (c.powerup === 'double') {
          this.runnerDoubleCoin = 8.0;
          this.showRunnerPowerupMsg('DOUBLE COINS!');
        } else {
          // Normal coin — apply multiplier
          const gain = (this.runnerDoubleCoin > 0 ? 2 : 1) * this.runnerMultiplier;
          this.inventory.shekels += gain;
          this.updateInventoryHUD();
          // Increment multiplier (max 4)
          if (this.runnerMultiplier < 4) {
            this.runnerMultiplier++;
            const mEl = document.getElementById('runner-multiplier');
            if (mEl) mEl.textContent = 'x' + this.runnerMultiplier;
          }
        }
        return false;
      }
      return true;
    });

    // ── Joystick lane input (edge detect) — right = higher lane, left = lower lane
    if (this.joy.active && this.joy.mag > 0.45) {
      const jx = Math.cos(this.joy.angle);
      const jy = Math.sin(this.joy.angle);
      if (!this.runnerLanePrevJoy) {
        this.runnerLanePrevJoy = true;
        if      (jx > 0.5  && this.runnerTargetLane < 2) this.runnerTargetLane++;
        else if (jx < -0.5 && this.runnerTargetLane > 0) this.runnerTargetLane--;
        else if (jy < -0.5 && !this.runnerJumping) this.startRunnerJump();
      }
    } else {
      this.runnerLanePrevJoy = false;
    }

    // ── Collision
    this.checkRunnerCollision();

    // ── Progress bar (existing runner bar)
    const fill = document.getElementById('runner-bar-fill');
    if (fill) fill.style.width = (pct * 100) + '%';

    // ── Damascus progress bar
    const dpFill = document.getElementById('damascus-progress-fill');
    if (dpFill) dpFill.style.width = (pct * 100) + '%';

    // ── Sky color shift (daytime blue → dusk orange at 90s)
    if (this.scene.background && this.runnerTime > 90) {
      const dusk = new THREE.Color(0xFF7043);
      const day  = new THREE.Color(0x87CEEB);
      const t = Math.min((this.runnerTime - 90) / (this.runnerTimeLimit - 90), 1.0);
      this.scene.background.copy(day).lerp(dusk, t);
    }

    // ── Growing light near end (last 20%)
    if (pct > 0.8 && this.runnerAmbientLight) {
      this.runnerAmbientLight.intensity = 0.4 + (pct - 0.8) / 0.2 * 2.0;
      // Shift sky toward white
      const white = new THREE.Color(0xffffff);
      const t2 = (pct - 0.8) / 0.2;
      if (this.scene.background) this.scene.background.lerp(white, t2 * 0.5);
      // Create/update growing white light ahead of player
      if (!this.runnerEndLight) {
        this.runnerEndLight = new THREE.PointLight(0xffffff, 0, 200);
        this.scene.add(this.runnerEndLight);
      }
      this.runnerEndLight.position.set(0, 20, this.player.pos.z + 50);
      this.runnerEndLight.intensity = (pct - 0.8) / 0.2 * 3.0;
    }

    // ── Finish check
    if (this.runnerTime >= this.runnerTimeLimit) {
      this.finishRunner();
    }
  },

  showRunnerPowerupMsg(text) {
    let el = document.getElementById('runner-powerup-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'runner-powerup-msg';
      el.style.cssText = [
        'position:fixed','top:30%','left:50%','transform:translateX(-50%)',
        'z-index:200','font-family:Cinzel,serif','font-size:1.6rem',
        'color:#f0c840','font-weight:700','text-shadow:0 0 20px rgba(255,200,0,0.9)',
        'pointer-events:none','text-align:center','transition:opacity 0.5s',
        'letter-spacing:0.1em'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(this._powerupMsgTimer);
    this._powerupMsgTimer = setTimeout(() => { el.style.opacity = '0'; }, 2000);
  },

  showRunnerQuote(text) {
    let el = document.getElementById('runner-quote');
    if (!el) {
      el = document.createElement('div');
      el.id = 'runner-quote';
      el.style.cssText = [
        'position:fixed','top:50%','left:50%','transform:translate(-50%,-50%)',
        'z-index:190','background:rgba(0,0,0,0.6)','padding:18px 28px',
        'border-radius:10px','max-width:420px','text-align:center',
        'font-family:Crimson Text,Georgia,serif','font-style:italic',
        'font-size:1.05rem','color:#f5f0e0','pointer-events:none',
        'line-height:1.65','transition:opacity 0.6s','opacity:0',
        'border:1px solid rgba(201,168,76,0.3)'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(this._quoteMsgTimer);
    this._quoteMsgTimer = setTimeout(() => { el.style.opacity = '0'; }, 3000);
  },

  updateRunnerCamera(dt) {
    const px = this.player.pos.x;
    const pz = this.player.pos.z;
    const tx = px * 0.4;
    const tz = pz - 7;
    const ty = 5.5;
    this.cam.pos.x += (tx - this.cam.pos.x) * 10 * dt;
    this.cam.pos.y += (ty - this.cam.pos.y) * 5  * dt;
    this.cam.pos.z += (tz - this.cam.pos.z) * 8  * dt;
    this.camera.position.copy(this.cam.pos);
    // Screen shake
    if (this.runnerShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * 2 * this.runnerShake * 0.4;
      this.camera.position.y += (Math.random() - 0.5) * 2 * this.runnerShake * 0.4;
      this.runnerShake *= 0.75;
      if (this.runnerShake < 0.01) this.runnerShake = 0;
    }
    this.camera.lookAt(px, 0.5, pz + 10);
  },

  startRunnerJump() {
    this.runnerJumping  = true;
    this.runnerJumpVel  = 10.5;
    this.runnerJumpY    = 0.01;
  },

  checkRunnerCollision() {
    if (this.runnerInvincible > 0) return;
    const px = this.player.pos.x;
    const pz = this.player.pos.z;

    for (const obs of this.runnerObstacles) {
      const dz = Math.abs(pz - obs.z);

      // Full-gap obstacle: spans all lanes, must jump over it
      if (obs.mesh._isFullGap) {
        if (dz < 0.75 && this.runnerJumpY < obs.mesh._clearJumpY) {
          this.hitRunner(); return;
        }
        continue;
      }

      const dx = Math.abs(px - obs.laneX);

      // Sand dune — slows instead of hitting
      if (obs.type === 'dune') {
        if (dz < 1.2 && dx < 1.0 && this.runnerSlowed <= 0) {
          this.runnerSlowed = 1.0; // 1 second slow (speed multiplied in updateRunner)
        }
        continue;
      }

      if (dz < 1.0 && dx < 1.1) {
        // Jumpable obstacles: clear if player is high enough
        if (obs.mesh._clearJumpY !== undefined && obs.mesh._clearJumpY < 999) {
          if (this.runnerJumpY > obs.mesh._clearJumpY + 0.05) continue;
        }
        this.hitRunner();
        return;
      }
    }
  },

  hitRunner() {
    this.runnerInvincible = 2.0;
    this.runnerShake = 0.35;    // camera shake
    this.runnerMultiplier = 1;  // reset multiplier on hit
    const mEl = document.getElementById('runner-multiplier');
    if (mEl) mEl.textContent = 'x1';
    this.runnerLives--;
    // Update heart HUD
    const hEl = document.getElementById('rh-' + (this.runnerLives + 1));
    if (hEl) hEl.classList.add('lost');

    if (this.runnerLives <= 0) {
      this.restartRunner();
      return;
    }
    // Flash screen red
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;z-index:180;background:rgba(180,30,30,0.45);pointer-events:none;transition:opacity 0.5s;';
    document.body.appendChild(flash);
    setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 500); }, 120);
    this.showNotification('You were knocked back!\n' + this.runnerLives + ' chance' + (this.runnerLives === 1 ? '' : 's') + ' remaining.');
  },

  restartRunner() {
    // Remove all runner obstacles, coins, and road deco
    this.runnerObstacles.forEach(o => this.scene.remove(o.mesh));
    this.runnerCoins.forEach(c => this.scene.remove(c.mesh));
    this.runnerRoadMeshes.forEach(o => this.scene.remove(o.mesh));
    this.runnerObstacles  = [];
    this.runnerCoins      = [];
    this.runnerRoadMeshes = [];

    // Reset state
    this.player.pos.set(0, 0, 5);
    this.playerGroup.position.set(0, 0, 5);
    this.playerGroup.position.y = 0;
    this.runnerTime        = 0;
    this.runnerSpeed       = 8;
    this.runnerLane        = 1;
    this.runnerTargetLane  = 1;
    this._lastObsLane      = -1;
    this.runnerJumping     = false;
    this.runnerJumpY       = 0;
    this.runnerLives       = 3;
    this.runnerInvincible  = 0;
    this.runnerNextZ       = 28;
    this.runnerShake       = 0;
    this.runnerSlowed      = 0;
    this.runnerDoubleCoin  = 0;
    this.runnerMultiplier  = 1;
    this.runnerMilestonePrev = 0;
    this.encounterTriggered = false;

    // Restore hearts
    ['rh-1','rh-2','rh-3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('lost');
    });
    document.getElementById('runner-bar-fill').style.width = '0%';
    const dpFill = document.getElementById('damascus-progress-fill');
    if (dpFill) dpFill.style.width = '0%';
    const mEl = document.getElementById('runner-multiplier');
    if (mEl) mEl.textContent = 'x1';

    // Rebuild start
    this.buildRunnerStart();
    this.showNotification('Saul fell. Rise and continue\nthe road to Damascus.');
  },

  finishRunner() {
    if (this.runnerFinished) return;
    this.runnerFinished = true;
    this.runnerActive   = false;

    // Mountain pass mode — transition to Pisidian Antioch
    if (this._runnerMtnMode) {
      this._runnerMtnMode = false;
      let slowT = 0;
      const origSpeed = this.runnerSpeed;
      const slowInterval = setInterval(() => {
        slowT += 0.016;
        this.runnerSpeed = Math.max(1, origSpeed * (1 - slowT));
        if (slowT >= 1.0) clearInterval(slowInterval);
      }, 16);

      setTimeout(() => {
        document.getElementById('hud').style.display = '';
        document.getElementById('runner-hud').classList.add('hidden');
        document.getElementById('runner-btns').classList.add('hidden');
        document.getElementById('jump-btn').style.display = 'none';
        const dpEl2 = document.getElementById('damascus-progress');
        if (dpEl2) dpEl2.style.display = 'none';

        this.showQuestPopup(
          'Through the Taurus Mountains',
          'After many days of hard travel, Paul and Barnabas arrived at Pisidian Antioch.',
          'Acts 13:14'
        );
        const dismissBtn = document.getElementById('qp-dismiss');
        if (dismissBtn) {
          dismissBtn.onclick = () => {
            document.getElementById('quest-popup').classList.add('hidden');
            this.dialogueActive = false;
            this.loadPisidianAntioch();
          };
        }
      }, 1200);
      return;
    }

    // Damascus Road mode (original behaviour)
    let slowT = 0;
    const origSpeed = this.runnerSpeed;
    const slowInterval = setInterval(() => {
      slowT += 0.016;
      this.runnerSpeed = Math.max(2, origSpeed * (1 - slowT));
      if (slowT >= 1.0) clearInterval(slowInterval);
    }, 16);

    setTimeout(() => {
      // White screen flash
      const wFlash = document.createElement('div');
      wFlash.style.cssText = 'position:fixed;inset:0;z-index:250;background:white;pointer-events:none;transition:opacity 1.2s;';
      document.body.appendChild(wFlash);
      setTimeout(() => {
        wFlash.style.opacity = '0';
        setTimeout(() => wFlash.remove(), 1200);
      }, 300);

      // Restore main HUD
      document.getElementById('hud').style.display = '';
      document.getElementById('runner-hud').classList.add('hidden');
      document.getElementById('runner-btns').classList.add('hidden');
      document.getElementById('jump-btn').style.display = 'none';
      document.getElementById('runner-bar-fill').style.width = '100%';
      const dpFill = document.getElementById('damascus-progress-fill');
      if (dpFill) dpFill.style.width = '100%';
      const mElF = document.getElementById('runner-multiplier');
      if (mElF) mElF.style.display = 'none';
      const dpEl = document.getElementById('damascus-progress');
      if (dpEl) dpEl.style.display = 'none';

      this.triggerEncounter();

      // Auto-complete after encounter plays out (encounter ~7s, then blind walk, then Ananias)
      // Ananias dialogue triggers at z>307 via updatePlayer, so we use a generous timer as fallback
      setTimeout(() => {
        if (!this.sightRestored) {
          this.restoreSight();
        }
        setTimeout(() => this.showDamascusComplete(), 2500);
      }, 22000);
    }, 1000);
  },

  // ── RUNNER: CONTROLS ──────────────────────────────────────
  initRunnerControls() {
    this._runnerKeyDown = (e) => {
      if (!this.runnerActive || this.runnerFinished) return;
      if (e.key === 'ArrowLeft'  && this.runnerTargetLane < 2) { e.preventDefault(); this.runnerTargetLane++; }
      if (e.key === 'ArrowRight' && this.runnerTargetLane > 0) { e.preventDefault(); this.runnerTargetLane--; }
      if ((e.key === 'ArrowUp' || e.key === ' ') && !this.runnerJumping && !this.dialogueActive) {
        e.preventDefault(); this.startRunnerJump();
      }
    };
    window.addEventListener('keydown', this._runnerKeyDown);

    // Swipe detection on canvas
    let sx = 0, sy = 0;
    const canvas = document.getElementById('game-canvas');
    this._runnerTouchStart = (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    this._runnerTouchEnd   = (e) => {
      if (!this.runnerActive || this.runnerFinished || this.dialogueActive) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
        if (dx > 0 && this.runnerTargetLane < 2) this.runnerTargetLane++;
        if (dx < 0 && this.runnerTargetLane > 0) this.runnerTargetLane--;
      } else if (dy < -25 && !this.runnerJumping) {
        this.startRunnerJump();
      }
    };
    canvas.addEventListener('touchstart', this._runnerTouchStart, { passive: true });
    canvas.addEventListener('touchend',   this._runnerTouchEnd,   { passive: true });

    // Lane buttons
    const bl = document.getElementById('rb-left');
    const br = document.getElementById('rb-right');
    if (bl) bl.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.runnerTargetLane > 0) this.runnerTargetLane--; }, { passive: false });
    if (br) br.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.runnerTargetLane < 2) this.runnerTargetLane++; }, { passive: false });

    // Jump button
    const jb = document.getElementById('jump-btn');
    if (jb) jb.addEventListener('touchstart', (e) => { e.preventDefault(); if (!this.runnerJumping && !this.dialogueActive) this.startRunnerJump(); }, { passive: false });
  },

  // ── DAMASCUS ROAD CUTSCENE ────────────────────────────────
  triggerDamascusRoad() {
    if (this.damascusTriggered) return;
    this.damascusTriggered = true;

    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:100',
      'background:rgba(0,0,0,0)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'transition:background 1.5s ease',
      'font-family:Cinzel,serif',
      'text-align:center',
      'padding:40px',
    ].join(';');
    document.body.appendChild(overlay);

    // Fade to black
    requestAnimationFrame(() => {
      overlay.style.background = 'rgba(0,0,0,1)';
    });

    // First title
    const title = document.createElement('div');
    title.textContent = 'The Road to Damascus';
    title.style.cssText = [
      'color:#c9a84c',
      'font-size:clamp(1.4rem,4vw,2.2rem)',
      'font-weight:700',
      'letter-spacing:0.1em',
      'opacity:0',
      'transition:opacity 1.2s ease',
      'margin-bottom:28px',
      'text-shadow:0 0 20px rgba(201,168,76,0.7)',
    ].join(';');
    overlay.appendChild(title);

    // Quote
    const quote = document.createElement('div');
    quote.textContent = '"And Saul, yet breathing out threatenings and slaughter against the disciples of the Lord, went unto the high priest, and desired of him letters to Damascus." \u2014 Acts 9:1\u20132';
    quote.style.cssText = [
      'font-family:Crimson Text,Georgia,serif',
      'font-style:italic',
      'color:#f0e0b0',
      'font-size:clamp(1rem,2.5vw,1.3rem)',
      'max-width:560px',
      'line-height:1.7',
      'opacity:0',
      'transition:opacity 1.5s ease',
    ].join(';');
    overlay.appendChild(quote);

    // Show title after fade-to-black
    setTimeout(() => {
      title.style.opacity = '1';
    }, 1600);

    // Show quote
    setTimeout(() => {
      quote.style.opacity = '1';
    }, 2800);

    // Fade to black then load Damascus Road
    setTimeout(() => {
      overlay.style.transition = 'background 1.5s ease';
      overlay.style.background = 'rgba(0,0,0,1)';
      setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
        this.loadDamascusRoad();
        // Fade in from black
        const fadeIn = document.createElement('div');
        fadeIn.style.cssText = 'position:fixed;inset:0;z-index:95;background:rgba(0,0,0,1);pointer-events:none;transition:opacity 2s ease;';
        document.body.appendChild(fadeIn);
        requestAnimationFrame(() => { fadeIn.style.opacity = '0'; });
        setTimeout(() => { if (fadeIn.parentNode) fadeIn.remove(); }, 2100);
      }, 1600);
    }, 3500);
  },

  // ── LOAD DAMASCUS ROAD LEVEL ──────────────────────────────
  loadDamascusRoad() {
    this.damascusRoadActive = true;

    // Remove all Jerusalem scene objects
    const toRemove = [];
    for (const child of this.scene.children) {
      if (!child.isLight) toRemove.push(child);
    }
    toRemove.forEach(o => this.scene.remove(o));
    this.scene.add(this.playerGroup); // playerGroup was in toRemove — put it back

    // Clear Jerusalem systems
    this.npcPatrolStates = {};
    for (const d of this.dustParticles) { d.mesh.geometry.dispose(); d.mesh.material.dispose(); }
    this.dustParticles = [];

    // Atmosphere — daytime blue sky
    this.scene.fog = new THREE.Fog(0xe8d5a0, 30, 120);
    this.scene.background = new THREE.Color(0x87CEEB);

    // Sun point light
    const sunLight = new THREE.PointLight(0xffe090, 1.5, 500);
    sunLight.position.set(50, 80, 200);
    this.scene.add(sunLight);

    // Ambient light (stored for end-sequence)
    const ambLight = new THREE.AmbientLight(0xffeedd, 0.4);
    this.scene.add(ambLight);
    this.runnerAmbientLight = ambLight;

    // Directional light for shadows
    const dirLight = new THREE.DirectionalLight(0xfff0cc, 1.1);
    dirLight.position.set(10, 20, -5);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Init runner state
    this.runnerActive      = true;
    this.runnerFinished    = false;
    this.runnerLane        = 1;
    this.runnerTargetLane  = 1;
    this.runnerSpeed       = 8;
    this.runnerTime        = 0;
    this.runnerJumping     = false;
    this.runnerJumpY       = 0;
    this.runnerJumpVel     = 0;
    this.runnerLives       = 3;
    this.runnerInvincible  = 0;
    this.runnerObstacles   = [];
    this.runnerRoadMeshes  = [];
    this.runnerNextZ       = 28;
    this.runnerShake       = 0;
    this.runnerSlowed      = 0;
    this.runnerDoubleCoin  = 0;
    this.runnerMultiplier  = 1;
    this.runnerMultiplierTimer = 0;
    this.runnerMilestones  = [30, 60, 90];
    this.runnerMilestonePrev = 0;
    this.runnerEndLight    = null;
    this.encounterTriggered = false;

    // Place player at start
    this.player.pos.set(0, 0, 5);
    this.playerGroup.position.set(0, 0, 5);
    this.playerGroup.position.y = 0;
    this.templeInside = false;

    // Camera behind player
    this.cam.pos.set(0, 5.5, -1);

    // Build initial road
    this.buildRunnerStart();
    this.mountPlayerOnHorse();
    this.initRunnerControls();

    // Create dust particle pool (12 small spheres)
    this.runnerDustParticles = [];
    for (let i = 0; i < 12; i++) {
      const pm = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 5, 4),
        new THREE.MeshStandardMaterial({ color: 0xc8a870, transparent: true, opacity: 0.7, roughness: 1.0 })
      );
      pm.visible = false;
      pm.life    = 0;
      pm.maxLife = 0.5;
      pm.vel     = new THREE.Vector3();
      this.scene.add(pm);
      this.runnerDustParticles.push(pm);
    }

    // HUD
    document.getElementById('hud').style.display = 'none';
    document.getElementById('runner-hud').classList.remove('hidden');
    document.getElementById('jump-btn').style.display = '';
    const isMobile = 'ontouchstart' in window;
    if (isMobile) document.getElementById('runner-btns').classList.remove('hidden');
    document.getElementById('location-name').textContent = 'Road to Damascus';

    // Reset multiplier HUD
    const mEl = document.getElementById('runner-multiplier');
    if (mEl) { mEl.textContent = 'x1'; mEl.style.display = ''; }

    // Show & reset Damascus progress bar
    const dpEl = document.getElementById('damascus-progress');
    if (dpEl) dpEl.style.display = '';
    const dpFill = document.getElementById('damascus-progress-fill');
    if (dpFill) dpFill.style.width = '0%';

    // Show brief intro card
    this.showQuestPopup(
      'The Road to Damascus',
      'Dodge travelers and soldiers. Jump over rocks and fallen logs. Reach Damascus before nightfall.',
      '— Acts 9:3'
    );
  },

  // ── MOUNT PAUL ON HORSE ───────────────────────────────────
  mountPlayerOnHorse() {
    if (this.runnerHorse) return;

    // Lift Paul's existing mesh into a rider sub-group
    const rider = new THREE.Group();
    rider.position.y = 0.82;
    // No extra rotation — playerGroup.rotation.y = Math.PI already faces Paul forward
    while (this.playerGroup.children.length) {
      rider.add(this.playerGroup.children[0]);
    }
    this.playerGroup.add(rider);
    this.runnerPaulRider = rider;

    // Build horse mesh
    const g   = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x2e1408, roughness: 0.85 });
    const mat2= new THREE.MeshStandardMaterial({ color: 0x200e04, roughness: 0.85 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 1.7, 8), mat);
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 0.6, 0);

    const rump = new THREE.Mesh(new THREE.SphereGeometry(0.38, 7, 5), mat.clone());
    rump.scale.set(0.7, 0.72, 0.9);
    rump.position.set(-0.75, 0.78, 0);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.72, 7), mat.clone());
    neck.rotation.z = -0.52;
    neck.position.set(0.82, 1.0, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.26), mat.clone());
    head.position.set(1.22, 1.3, 0);

    const muzz = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.2), mat2.clone());
    muzz.position.set(1.48, 1.18, 0);

    const mane = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.1), mat2.clone());
    mane.position.set(0.2, 1.02, 0);

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.10, 0.48, 6), mat2.clone());
    tail.rotation.z = 0.45;
    tail.position.set(-1.05, 0.64, 0);

    [[-0.52,-0.18],[-0.52,0.18],[0.42,-0.18],[0.42,0.18]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.58, 6), mat.clone());
      leg.position.set(lx, 0.29, lz);
      g.add(leg);
    });

    g.add(body); g.add(rump); g.add(neck); g.add(head); g.add(muzz); g.add(mane); g.add(tail);
    g.rotation.y = -Math.PI / 2; // align horse head to face +Z (direction of travel)
    this.playerGroup.add(g);
    this.runnerHorse = g;
  },

  // ── BUILD DAMASCUS ROAD ENVIRONMENT ───────────────────────
  buildDamascusRoadWorld() {
    const dustMat  = new THREE.MeshStandardMaterial({ color: 0xc8a870, roughness: 1.0, metalness: 0 });
    const roadMat  = new THREE.MeshStandardMaterial({ color: 0xb09070, roughness: 0.95, metalness: 0 });
    const rutMat   = new THREE.MeshStandardMaterial({ color: 0x907858, roughness: 0.98, metalness: 0 });
    const rockMat  = new THREE.MeshStandardMaterial({ color: 0x888070, roughness: 0.95, metalness: 0 });
    const darkRock = new THREE.MeshStandardMaterial({ color: 0x706858, roughness: 0.95, metalness: 0 });
    const hillMat  = new THREE.MeshStandardMaterial({ color: 0xa09070, roughness: 1.0,  metalness: 0 });
    const mileMat  = new THREE.MeshStandardMaterial({ color: 0xc0b090, roughness: 0.82, metalness: 0 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.95, metalness: 0 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x6a5830, roughness: 0.90, metalness: 0 });

    // Ground plane — extending far into the horizon
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 360), dustMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 170);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Far horizon ground plane stretching ahead
    const farGround = new THREE.Mesh(new THREE.PlaneGeometry(200, 2000), dustMat.clone());
    farGround.rotation.x = -Math.PI / 2;
    farGround.position.set(0, -0.01, 500);
    this.scene.add(farGround);

    // Background is already set in loadDamascusRoad (0x87CEEB); don't override here

    // Main road
    const road = new THREE.Mesh(new THREE.PlaneGeometry(5, 340), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.03, 165);
    road.receiveShadow = true;
    this.scene.add(road);

    // Wheel ruts
    [-1.3, 1.3].forEach(rx => {
      const rut = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 340), rutMat);
      rut.rotation.x = -Math.PI / 2;
      rut.position.set(rx, 0.04, 165);
      this.scene.add(rut);
    });

    // Rocks scattered on sides
    const rSeeds = [
      [5.5, 12],[7, 24],[6, 38],[8.5, 52],[5, 68],[7.5, 84],[6, 100],
      [8, 118],[5.5, 134],[7, 150],[6.5, 166],[8, 182],[5, 198],
      [7, 214],[6, 230],[8.5, 246],[5.5, 262],[7, 278],[6, 292],
      [-5.5,18],[-7,30],[-6,46],[-8,62],[-5,78],[-7.5,94],[-6.5,110],
      [-7,126],[-5.5,142],[-8,158],[-6,174],[-7.5,190],[-5,206],
      [-6.5,222],[-8,238],[-7,254],[-5.5,270],[-6,286],[-8,298],
    ];
    let rng = 0.5; // deterministic pseudo-random
    const rand = () => { rng = (rng * 1664525 + 1013904223) % 4294967296; return rng / 4294967296; };

    rSeeds.forEach(([rx, rz]) => {
      const s = 0.5 + rand() * 1.5;
      const rock = new THREE.Mesh(
        new THREE.BoxGeometry(s, s * 0.65, s * 0.9),
        rand() > 0.5 ? rockMat : darkRock
      );
      rock.position.set(rx, s * 0.32, rz);
      rock.rotation.y = rand() * Math.PI;
      rock.castShadow = true;
      this.scene.add(rock);
    });

    // Boulders
    [[14,28],[-16,55],[19,92],[-21,138],[16,196],[-18,248],[15,290],
     [-13,22],[21,162],[-23,218]].forEach(([bx, bz]) => {
      const w = 2.2 + rand() * 0.8;
      const boulder = new THREE.Mesh(new THREE.BoxGeometry(w, 1.7, w * 0.9), rockMat);
      boulder.position.set(bx, 0.85, bz);
      boulder.rotation.y = rand() * Math.PI;
      boulder.castShadow = true;
      this.scene.add(boulder);
    });

    // Milestone posts every ~50 units
    for (let mz = 40; mz < 295; mz += 50) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 1.5, 7), mileMat);
      post.position.set(3.5, 0.75, mz);
      post.castShadow = true;
      this.scene.add(post);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.38), mileMat);
      cap.position.set(3.5, 1.56, mz);
      this.scene.add(cap);
    }

    // Sparse dead palms
    [[10.5,22],[-12,40],[13.5,78],[-11,110],[12,148],[-14,182],
     [11,218],[-12.5,255],[10,280],[-11,295]].forEach(([tx, tz]) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, 4.8, 6), trunkMat);
      trunk.position.set(tx, 2.4, tz);
      trunk.castShadow = true;
      this.scene.add(trunk);
      for (let f = 0; f < 4; f++) {
        const angle = (f / 4) * Math.PI * 2 + rand();
        const frond = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 1.9), frondMat);
        frond.position.set(tx + Math.sin(angle) * 0.85, 4.3, tz + Math.cos(angle) * 0.85);
        frond.rotation.y = angle;
        frond.rotation.x = 0.55;
        this.scene.add(frond);
      }
    });

    // Distant hills on both sides
    [[62,55,80],[-66,88,72],[64,150,100],[-62,205,88],[68,265,110],
     [-60,310,90],[65,320,80]].forEach(([hx, hz, hd]) => {
      const hill = new THREE.Mesh(new THREE.BoxGeometry(22, 14, hd), hillMat);
      hill.position.set(hx, 7, hz);
      this.scene.add(hill);
    });

    // Light dust patches on road
    const dustPatch = new THREE.MeshStandardMaterial({ color: 0xc4a468, roughness: 1.0 });
    [50, 105, 160, 215, 270].forEach(pz => {
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(3.5 + rand() * 1.5, 4 + rand() * 3), dustPatch);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set((rand() - 0.5) * 2, 0.035, pz);
      this.scene.add(patch);
    });

    // Build Damascus city at the end
    this.buildDamascusCity();

    // Build Ananias NPC
    this.buildAnaniasNPC();
  },

  // ── DAMASCUS CITY (visible destination) ───────────────────
  buildDamascusCity() {
    const wallMat   = new THREE.MeshStandardMaterial({ color: 0xc8a870, roughness: 0.88, metalness: 0 });
    const wallTop   = new THREE.MeshStandardMaterial({ color: 0xb89858, roughness: 0.82, metalness: 0 });
    const buildA    = new THREE.MeshStandardMaterial({ color: 0xd0b888, roughness: 0.88, metalness: 0 });
    const buildB    = new THREE.MeshStandardMaterial({ color: 0xb89050, roughness: 0.90, metalness: 0 });
    const buildC    = new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 0.88, metalness: 0 });

    // City wall — gap at x:-4 to +4 for the gate road
    const leftWall  = new THREE.Mesh(new THREE.BoxGeometry(26, 7, 3), wallMat);
    leftWall.position.set(-17, 3.5, 302);
    leftWall.castShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(26, 7, 3), wallMat);
    rightWall.position.set(17, 3.5, 302);
    rightWall.castShadow = true;
    this.scene.add(rightWall);

    // Wall crenellations (top row of blocks)
    [-17, 17].forEach(wx => {
      for (let cx = wx - 11; cx <= wx + 11; cx += 2.2) {
        const cren = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.0), wallTop);
        cren.position.set(cx, 7.7, 302);
        this.scene.add(cren);
      }
    });

    // Gate pillars
    [-5.5, 5.5].forEach(gx => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 10, 4), wallMat);
      pillar.position.set(gx, 5, 302);
      pillar.castShadow = true;
      this.scene.add(pillar);
    });

    // Gate lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(11, 1.8, 3.5), wallTop);
    lintel.position.set(0, 10.9, 302);
    this.scene.add(lintel);

    // Road through gate
    const gateRoad = new THREE.Mesh(new THREE.PlaneGeometry(5, 12),
      new THREE.MeshStandardMaterial({ color: 0xb09070, roughness: 0.95 }));
    gateRoad.rotation.x = -Math.PI / 2;
    gateRoad.position.set(0, 0.04, 307);
    this.scene.add(gateRoad);

    // Buildings inside city
    [
      [0,   316, 9, 10, 8, buildA],
      [-11, 318, 7,  9, 7, buildB],
      [11,  320, 7,  8, 7, buildC],
      [-21, 314, 8,  7, 7, buildA],
      [21,  315, 7,  8, 6, buildB],
      [-5,  330, 6, 12, 6, buildC],
      [5,   328, 8,  9, 8, buildA],
      [-15, 328, 6,  7, 6, buildB],
      [15,  326, 7,  8, 6, buildA],
    ].forEach(([bx, bz, bw, bh, bd, mat]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
      b.position.set(bx, bh / 2, bz);
      b.castShadow = true;
      this.scene.add(b);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.4, 0.35, bd + 0.4), wallTop);
      roof.position.set(bx, bh + 0.18, bz);
      this.scene.add(roof);
    });

    // "Straight Street" sign post inside Damascus
    const signMat = new THREE.MeshStandardMaterial({ color: 0x8a6a30, roughness: 0.9 });
    const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), signMat);
    signPost.position.set(3, 0.75, 310);
    this.scene.add(signPost);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xc8a050, roughness: 0.5, metalness: 0.2 }));
    signBoard.position.set(3, 1.7, 310);
    this.scene.add(signBoard);

    // Add Damascus wall colliders
    this.damascusColliders = [
      { minX: -30.5, maxX: -6.5, minZ: 299.5, maxZ: 304.5 },
      { minX:   6.5, maxX:  30.5, minZ: 299.5, maxZ: 304.5 },
      { minX: -7.5,  maxX: -2.5, minZ: 299.5, maxZ: 304.5 },  // left gate pillar
      { minX:  2.5,  maxX:  7.5, minZ: 299.5, maxZ: 304.5 },  // right gate pillar
    ];
    // Push into WORLD colliders so collidesAt() picks them up
    this.damascusColliders.forEach(c => WORLD.colliders.push(c));
  },

  // ── ANANIAS NPC ───────────────────────────────────────────
  buildAnaniasNPC() {
    const group   = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.88, metalness: 0 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xc09060, roughness: 0.88, metalness: 0 });
    const accMat  = new THREE.MeshStandardMaterial({ color: 0x7aaa7a, roughness: 0.3,  metalness: 0.5 });

    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.37, 1.05, 8), bodyMat);
    robe.position.y = 0.525;
    robe.castShadow = true;
    group.add(robe);

    const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.07, 8), accMat);
    hem.position.y = 0.035;
    group.add(hem);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), headMat);
    head.position.y = 1.26;
    head.castShadow = true;
    group.add(head);

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 4, 12), accMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = 1.30;
    group.add(band);

    const beardMat = new THREE.MeshStandardMaterial({ color: 0xc8b888, roughness: 0.88 });
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 4), beardMat);
    beard.scale.set(1, 0.7, 0.8);
    beard.position.set(0, 1.14, 0.15);
    group.add(beard);

    group.position.set(0, 0, 310);
    group.rotation.y = Math.PI; // faces south (toward approaching player)
    this.scene.add(group);
    this.ananiasGroup = group;
  },

  // ── DAMASCUS ROAD ENCOUNTER (blinding light) ──────────────
  triggerEncounter() {
    if (this.encounterTriggered) return;
    this.encounterTriggered = true;
    this.dialogueActive = true; // freeze player

    const ov = document.createElement('div');
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:80',
      'background:rgba(255,255,255,0)',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'pointer-events:none', 'text-align:center',
      'padding:40px', 'transition:background 0.3s ease',
    ].join(';');
    document.body.appendChild(ov);

    const mkLine = (txt, css) => {
      const d = document.createElement('div');
      d.innerHTML = txt;
      d.style.cssText = css + 'opacity:0;transition:opacity 1.3s ease;';
      ov.appendChild(d);
      return d;
    };

    // Flash white
    requestAnimationFrame(() => { ov.style.background = 'rgba(255,255,255,1)'; });

    const t1 = mkLine('\u26a1 A LIGHT FROM HEAVEN \u26a1',
      'font-family:Cinzel,serif;color:#1a0800;font-size:clamp(1.1rem,4vw,1.8rem);font-weight:700;letter-spacing:0.12em;margin-bottom:24px;');
    const t2 = mkLine('\u201cSaul, Saul, why persecutest thou me?\u201d',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#2a0800;font-size:clamp(1rem,3vw,1.4rem);max-width:460px;line-height:1.8;margin-bottom:14px;');
    const t3 = mkLine('\u2014 Acts 9:4',
      'font-family:Cinzel,serif;color:#4a1800;font-size:0.82rem;letter-spacing:0.12em;margin-bottom:30px;');
    const t4 = mkLine('\u201cI am Jesus whom thou persecutest.\u201d &nbsp;\u2014 Acts 9:5',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#1a0800;font-size:clamp(0.9rem,2.5vw,1.2rem);max-width:440px;line-height:1.8;margin-bottom:24px;');
    const t5 = mkLine('\u201cArise, and go into the city, and it shall be told thee what thou must do.\u201d &nbsp;\u2014 Acts 9:6',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#2a1400;font-size:clamp(0.85rem,2.2vw,1.05rem);max-width:460px;line-height:1.8;');

    setTimeout(() => { t1.style.opacity = '1'; }, 500);
    setTimeout(() => { t2.style.opacity = '1'; }, 1600);
    setTimeout(() => { t3.style.opacity = '1'; }, 2400);
    setTimeout(() => { t4.style.opacity = '1'; }, 3500);
    setTimeout(() => { t5.style.opacity = '1'; }, 5000);

    // Fade overlay out, activate blind effect, unlock movement
    setTimeout(() => {
      ov.style.transition = 'background 2s ease, opacity 2s ease';
      ov.style.opacity    = '0';
      // Activate blindness
      this.blindActive = true;
      const blindEl = document.getElementById('blind-overlay');
      if (blindEl) blindEl.classList.add('active');
      this.dialogueActive = false; // player can move again
      this.elQuestText.textContent    = 'Follow the road to Damascus \u2014 Arise and go into the city';
      this.elScriptureRef.textContent = 'Acts 9:6';
      setTimeout(() => { if (ov.parentNode) ov.remove(); }, 2100);
    }, 7000);
  },

  // ── RESTORE SIGHT (Ananias heals Paul) ────────────────────
  restoreSight() {
    this.blindActive = false;
    const blindEl = document.getElementById('blind-overlay');
    if (blindEl) blindEl.classList.remove('active');

    this.elQuestText.textContent    = 'Damascus \u2014 you have arrived';
    this.elScriptureRef.textContent = 'Acts 9:17\u201318';
    this.showNotification('Ananias lays hands on you.\n\u201cBrother Saul, receive thy sight.\u201d \u2014 Acts 9:17\nYour sight is restored!');
  },

  // ── ANANIAS DIALOGUE (Damascus arrival) ───────────────────
  startAnaniasDialogue() {
    // Use existing dialogue system with a fake NPC object
    this.currentDialogueNPC = {
      data: {
        id: 'ananias',
        name: 'Ananias',
        dialogues: [
          { speaker: 'Ananias', text: '\u201cBrother Saul, the Lord, even Jesus, that appeared unto thee in the way as thou camest, hath sent me, that thou mightest receive thy sight.\u201d \u2014 Acts 9:17' },
          { speaker: 'Ananias', text: '\u201cAnd immediately there fell from his eyes as it had been scales: and he received sight forthwith.\u201d \u2014 Acts 9:18' },
          { speaker: 'Ananias', text: '\u201cArise, be baptized, and wash away thy sins, calling on the name of the Lord. You have been transformed, Saul of Tarsus.\u201d \u2014 Acts 22:16' },
        ],
        onComplete: 'restore_sight',
      },
    };
    this.startDialogue(this.currentDialogueNPC);
  },

  // ── DAMASCUS LEVEL COMPLETE ───────────────────────────────
  showDamascusComplete() {
    const ov = document.createElement('div');
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:200',
      'background:rgba(0,0,0,0)',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'font-family:Cinzel,serif', 'text-align:center',
      'padding:40px', 'transition:background 1.5s ease',
    ].join(';');
    document.body.appendChild(ov);
    requestAnimationFrame(() => { ov.style.background = 'rgba(0,0,0,0.92)'; });

    const mk = (txt, css) => {
      const d = document.createElement('div');
      d.innerHTML = txt;
      d.style.cssText = css + 'opacity:0;transition:opacity 1.2s ease;';
      ov.appendChild(d);
      return d;
    };

    const t1 = mk('Damascus', 'color:#c9a84c;font-size:clamp(2rem,6vw,3rem);font-weight:700;letter-spacing:0.15em;text-shadow:0 0 30px rgba(201,168,76,0.5);margin-bottom:6px;');
    const t2 = mk('The Journey Continues\u2026', 'color:#7a6030;font-size:clamp(0.8rem,2vw,1rem);letter-spacing:0.2em;margin-bottom:36px;');
    const t3 = mk('\u201cAnd straightway he preached Christ in the synagogues, that he is the Son of God.\u201d<br><span style="font-size:0.85em;color:#9a8050">\u2014 Acts 9:20</span>',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#c8b880;font-size:clamp(0.9rem,2.4vw,1.1rem);max-width:500px;line-height:1.8;margin-bottom:36px;');

    setTimeout(() => { t1.style.opacity = '1'; }, 800);
    setTimeout(() => { t2.style.opacity = '1'; }, 1500);
    setTimeout(() => { t3.style.opacity = '1'; }, 2400);

    // After showing Damascus complete — transition to Antioch
    setTimeout(() => {
      ov.style.transition = 'opacity 1.5s ease';
      ov.style.opacity = '0';
      setTimeout(() => {
        if (ov.parentNode) ov.remove();
        this.loadAntioch();
      }, 1600);
    }, 5500);
  },

  // ── TEMPLE INTERIOR FURNISHINGS ───────────────────────────
  buildTempleInterior() {
    const TF = 1.2; // temple platform floor height
    const goldMat   = new THREE.MeshStandardMaterial({ color: 0xd4a830, roughness: 0.25, metalness: 0.8 });
    const purpleMat = new THREE.MeshStandardMaterial({ color: 0x6a308a, roughness: 0.88, metalness: 0 });
    const flameMat  = new THREE.MeshStandardMaterial({ color: 0xffcc40, roughness: 0.1, metalness: 0,
                        emissive: new THREE.Color(0xffaa20), emissiveIntensity: 1.8 });

    // ── Veil / Curtain before the Holy of Holies ──────────
    const veilH   = 5.5;
    const veilGeo = new THREE.BoxGeometry(9, veilH, 0.12);
    const veil    = new THREE.Mesh(veilGeo, purpleMat);
    veil.position.set(0, TF + veilH / 2, -21.0);
    veil.castShadow = true;
    this.scene.add(veil);
    const vtMat = new THREE.MeshStandardMaterial({ color: 0xd4a830, roughness: 0.2, metalness: 0.85 });
    const vtGeo = new THREE.BoxGeometry(9.1, 0.12, 0.14);
    [TF + 0.06, TF + veilH].forEach(yv => {
      const vt = new THREE.Mesh(vtGeo, vtMat);
      vt.position.set(0, yv, -21.0);
      this.scene.add(vt);
    });

    // ── Menorah (7-branch golden lampstand) — center of hall
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.12, 7), goldMat);
    base.position.set(0, TF + 0.06, -16.5);
    this.scene.add(base);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.5, 6), goldMat);
    shaft.position.set(0, TF + 0.87, -16.5);
    this.scene.add(shaft);

    const armOffsets = [-0.84, -0.56, -0.28, 0, 0.28, 0.56, 0.84];
    const armHeights = [ 0.85,  0.95,  1.08, 1.2, 1.08, 0.95, 0.85];
    for (let i = 0; i < 7; i++) {
      if (i === 3) continue;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.38, 5), goldMat);
      arm.position.set(armOffsets[i], TF + armHeights[i], -16.5);
      this.scene.add(arm);
    }
    for (let i = 0; i < 7; i++) {
      const candleMat = new THREE.MeshStandardMaterial({ color: 0xf5edd0, roughness: 0.9 });
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 5), candleMat);
      candle.position.set(armOffsets[i], TF + armHeights[i] + 0.28, -16.5);
      this.scene.add(candle);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), flameMat);
      flame.position.set(armOffsets[i], TF + armHeights[i] + 0.46, -16.5);
      this.scene.add(flame);
    }

    // ── Table of Showbread (north wall, left side) ────────
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.55), goldMat);
    tableTop.position.set(-4.5, TF + 0.88, -16.5);
    this.scene.add(tableTop);
    [[-0.44,-0.22],[0.44,-0.22],[-0.44,0.22],[0.44,0.22]].forEach(([lx,lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), goldMat);
      leg.position.set(-4.5 + lx, TF + 0.425, -16.5 + lz);
      this.scene.add(leg);
    });
    // 2 rows of 3 loaves, all within table (x: -5.0 to -4.0)
    [[-4.8,-16.33],[-4.5,-16.33],[-4.2,-16.33],
     [-4.8,-16.67],[-4.5,-16.67],[-4.2,-16.67]].forEach(([bx, bz]) => {
      const breadMat = new THREE.MeshStandardMaterial({ color: 0xd4a060, roughness: 0.9 });
      const bread = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.18), breadMat);
      bread.position.set(bx, TF + 0.975, bz);
      this.scene.add(bread);
    });

    // ── Incense Altar ─────────────────────────────────────
    const incMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.55), goldMat);
    incMesh.position.set(0, TF + 0.375, -19.5);
    this.scene.add(incMesh);
    const smokeMat = new THREE.MeshStandardMaterial({ color: 0xddd8cc, roughness: 0.9, transparent: true, opacity: 0.55 });
    [-0.06, 0, 0.06].forEach((sx, si) => {
      const smoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5 + si * 0.1, 0.05), smokeMat);
      smoke.position.set(sx, TF + 0.8 + si * 0.05, -19.5 + sx * 0.5);
      this.scene.add(smoke);
    });

    // ── Ark of the Covenant (back, behind veil) ────────────
    const arkMat = new THREE.MeshStandardMaterial({ color: 0xd4a830, roughness: 0.2, metalness: 0.85 });
    const arkBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.7), arkMat);
    arkBox.position.set(0, TF + 0.35, -22.0);
    this.scene.add(arkBox);
    // Mercy seat / cherubim wings (simplified as wing shapes)
    [-0.45, 0.45].forEach(wx => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.55), arkMat);
      wing.position.set(wx, TF + 0.76, -22.0);
      wing.rotation.z = wx > 0 ? 0.4 : -0.4;
      this.scene.add(wing);
    });

    // ── Decorated floor tiles inside temple ───────────────
    const tileColors = [0xd8d0a0, 0xc8c090];
    for (let tx = -4; tx <= 4; tx += 2) {
      for (let tz = -12; tz >= -21; tz -= 2) {
        const col     = ((tx + tz) % 2 === 0) ? tileColors[0] : tileColors[1];
        const tileMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 });
        const tile    = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.04, 1.95), tileMat);
        tile.position.set(tx, TF + 0.02, tz);
        tile.receiveShadow = true;
        this.scene.add(tile);
      }
    }

    // ── Entrance urns ─────────────────────────────────────
    [[-2.5,-13.2],[2.5,-13.2]].forEach(([ux,uz], ui) => {
      const urnMat = new THREE.MeshStandardMaterial({ color: ui === 0 ? 0xc09050 : 0xa07040, roughness: 0.85 });
      const urn    = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.65, 7), urnMat);
      urn.position.set(ux, TF + 0.325, uz);
      urn.castShadow = true;
      this.scene.add(urn);
    });

    // ── Menorah warm glow ────────────────────────────────
    const menorahLight = new THREE.PointLight(0xffcc60, 2.0, 16);
    menorahLight.position.set(0, TF + 2.8, -16.5);
    this.scene.add(menorahLight);
  },

  // ── STABLE PEN ────────────────────────────────────────────
  buildStablePen() {
    const woodMat  = new THREE.MeshStandardMaterial({ color: 0x6a4a20, roughness: 0.9 });
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xc8a840, roughness: 0.95 });
    const dirtMat  = new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.95 });

    // Dirt floor of pen
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 8), dirtMat);
    floor.position.set(22, 0.025, 45);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Straw bedding patches
    [[20, 44], [24, 46], [21, 48]].forEach(([sx, sz]) => {
      const straw = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 1.2), strawMat);
      straw.position.set(sx, 0.06, sz);
      this.scene.add(straw);
    });

    // Fence posts (0.15 x 1.4 x 0.15) — north fence
    for (let fx = 17; fx <= 27; fx += 2) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 0.15), woodMat);
      post.position.set(fx, 0.7, 41);
      post.castShadow = true;
      this.scene.add(post);
    }
    // South fence
    for (let fx = 17; fx <= 27; fx += 2) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 0.15), woodMat);
      post.position.set(fx, 0.7, 49);
      post.castShadow = true;
      this.scene.add(post);
    }
    // East fence
    for (let fz = 41; fz <= 49; fz += 2) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 0.15), woodMat);
      post.position.set(27, 0.7, fz);
      post.castShadow = true;
      this.scene.add(post);
    }
    // West fence (split — gate gap at z:44-46)
    [41, 43].forEach(fz => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 0.15), woodMat);
      post.position.set(17, 0.7, fz);
      this.scene.add(post);
    });
    [47, 49].forEach(fz => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 0.15), woodMat);
      post.position.set(17, 0.7, fz);
      this.scene.add(post);
    });

    // Horizontal rails — 2 rails per fence side
    const railMat = new THREE.MeshStandardMaterial({ color: 0x7a5a28, roughness: 0.88 });
    // North + south rails
    [41, 49].forEach(rz => {
      [0.5, 1.0].forEach(ry => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 0.1), railMat);
        rail.position.set(22, ry, rz);
        this.scene.add(rail);
      });
    });
    // East rail
    [0.5, 1.0].forEach(ry => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 8), railMat);
      rail.position.set(27, ry, 45);
      this.scene.add(rail);
    });
    // West rails (north+south segments around gate gap)
    [[41, 43], [47, 49]].forEach(([z1, z2]) => {
      [0.5, 1.0].forEach(ry => {
        const d = z2 - z1;
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, d), railMat);
        rail.position.set(17, ry, (z1 + z2) / 2);
        this.scene.add(rail);
      });
    });

    // 3 decorative horses inside pen (always visible)
    [[20, 43.5, 0.3], [23, 46, -0.4], [25, 44, 0.1]].forEach(([hx, hz, ry]) => {
      const hGroup = new THREE.Group();
      const brMat  = new THREE.MeshStandardMaterial({ color: 0x7a3a10, roughness: 0.9 });
      const dkMat  = new THREE.MeshStandardMaterial({ color: 0x3a1a05, roughness: 0.9 });
      const body   = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 1.05), brMat);
      body.position.y = 0.7;
      hGroup.add(body);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.2), brMat);
      neck.position.set(0, 0.96, -0.4);
      hGroup.add(neck);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.36), brMat);
      head.position.set(0, 1.18, -0.56);
      hGroup.add(head);
      [[-0.18,-0.38],[0.18,-0.38],[-0.18,0.38],[0.18,0.38]].forEach(([lx,lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.46, 0.1), dkMat);
        leg.position.set(lx, 0.25, lz);
        hGroup.add(leg);
      });
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.26, 0.07), dkMat);
      tail.position.set(0, 0.76, 0.55);
      tail.rotation.x = 0.5;
      hGroup.add(tail);
      hGroup.position.set(hx, 0, hz);
      hGroup.rotation.y = ry;
      this.scene.add(hGroup);
    });

    // Water trough
    const troughMat = new THREE.MeshStandardMaterial({ color: 0x6a5030, roughness: 0.88 });
    const waterMat  = new THREE.MeshStandardMaterial({ color: 0x4878a0, roughness: 0.2 });
    const trough = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.4), troughMat);
    trough.position.set(26, 0.175, 43);
    this.scene.add(trough);
    const water = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.22), waterMat);
    water.position.set(26, 0.32, 43);
    this.scene.add(water);
  },

  // ── FOLLOWERS (recruited soldiers) ────────────────────────
  // ── PATROL NPCs (Roman soldiers) ──────────────────────────
  updatePatrolNPCs(dt) {
    for (const id in this.npcPatrolStates) {
      const npcObj = this.npcObjects[id];
      if (!npcObj) continue;
      const p = npcObj.data.patrol; // [ax,az, bx,bz]
      const s = this.npcPatrolStates[id];

      s.t += dt * 0.20 * s.dir;
      if (s.t >= 1) { s.t = 1; s.dir = -1; }
      if (s.t <= 0) { s.t = 0; s.dir = 1; }

      const nx = p[0] + (p[2] - p[0]) * s.t;
      const nz = p[1] + (p[3] - p[1]) * s.t;
      npcObj.group.position.x = nx;
      npcObj.group.position.z = nz;
      npcObj.group.position.y = this.getTerrainY(nx, nz);

      // Face direction of travel (unless very close to player — updateNPCFacing handles that)
      const ddx = (p[2] - p[0]) * s.dir;
      const ddz = (p[3] - p[1]) * s.dir;
      if (Math.abs(ddx) > 0.01 || Math.abs(ddz) > 0.01) {
        const tgt = Math.atan2(ddx, ddz);
        let diff = tgt - npcObj.group.rotation.y;
        while (diff >  Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        npcObj.group.rotation.y += diff * 0.08;
      }
    }
  },

  // ── FOOTSTEP DUST PARTICLES ────────────────────────────────
  spawnDust(x, y, z) {
    const geo = new THREE.CircleGeometry(0.07 + Math.random() * 0.06, 5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xc8a870, transparent: true, opacity: 0.35,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.28,
      y + 0.02,
      z + (Math.random() - 0.5) * 0.28
    );
    this.scene.add(mesh);
    this.dustParticles.push({
      mesh,
      life: 0,
      maxLife: 0.55 + Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 0.4,
      vz: (Math.random() - 0.5) * 0.4,
    });
  },

  updateDust(dt) {
    // Spawn when walking on ground (not in temple)
    if (this.player.moving && !this.templeInside && !this.damascusRoadActive) {
      this.dustSpawnTimer += dt;
      if (this.dustSpawnTimer > 0.09) {
        this.dustSpawnTimer = 0;
        const p = this.player.pos;
        this.spawnDust(p.x, this.getTerrainY(p.x, p.z), p.z);
      }
    }
    // Update existing particles
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const d = this.dustParticles[i];
      d.life += dt;
      const t = d.life / d.maxLife;
      d.mesh.material.opacity = 0.35 * (1 - t);
      d.mesh.scale.setScalar(1 + t * 1.8);
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.z += d.vz * dt;
      if (d.life >= d.maxLife) {
        this.scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();
        this.dustParticles.splice(i, 1);
      }
    }
  },

  updateFollowers(dt) {
    if (!this.hasLetters) return;
    const px = this.player.pos.x;
    const pz = this.player.pos.z;
    const followerIds = ['barnabas', 'lucius', 'silas', 'manaen'];
    // Tighter offset — form up close behind player
    const offsets = [[-0.85, 1.3], [0.85, 1.3], [-1.6, 2.4], [1.6, 2.4]];

    for (let i = 0; i < followerIds.length; i++) {
      const id = followerIds[i];
      if (!this.recruitedNPCs[id]) continue;
      const npc = this.npcObjects[id];
      if (!npc) continue;

      const targetX = px + offsets[i][0];
      const targetZ = pz + offsets[i][1];
      const dx = targetX - npc.group.position.x;
      const dz = targetZ - npc.group.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.1) {
        const spd = Math.min(dist * 5, this.player.speed * 1.2);
        const nx  = npc.group.position.x + (dx / dist) * spd * dt;
        const nz  = npc.group.position.z + (dz / dist) * spd * dt;

        // Wall avoidance: try full move, then slide on each axis
        if (!this.collidesAtStatic(nx, nz)) {
          npc.group.position.x = nx;
          npc.group.position.z = nz;
        } else if (!this.collidesAtStatic(nx, npc.group.position.z)) {
          npc.group.position.x = nx;
        } else if (!this.collidesAtStatic(npc.group.position.x, nz)) {
          npc.group.position.z = nz;
        }
        npc.group.position.y = this.getTerrainY(npc.group.position.x, npc.group.position.z);
        npc.group.rotation.y = Math.atan2(dx, dz);
      }

      // Horse follows same follower offset but a bit further back
      if (this.horseObjects[i]) {
        const hx = px + offsets[i][0] * 1.2;
        const hz = pz + offsets[i][1] + 1.5;
        const hdx = hx - this.horseObjects[i].position.x;
        const hdz = hz - this.horseObjects[i].position.z;
        const hd  = Math.sqrt(hdx * hdx + hdz * hdz);
        if (hd > 0.15) {
          const hs = Math.min(hd * 4, this.player.speed * 1.2);
          this.horseObjects[i].position.x += (hdx / hd) * hs * dt;
          this.horseObjects[i].position.z += (hdz / hd) * hs * dt;
          // Smooth rotation — horse model faces -Z
          const tgt = Math.atan2(hdx, hdz) + Math.PI;
          let d = tgt - this.horseObjects[i].rotation.y;
          while (d >  Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          this.horseObjects[i].rotation.y += d * 0.12;
        }
      }
    }

    // 5th horse follows directly behind player
    if (this.horseObjects[4]) {
      const hx = px;
      const hz = pz + 1.0;
      const hdx = hx - this.horseObjects[4].position.x;
      const hdz = hz - this.horseObjects[4].position.z;
      const hd  = Math.sqrt(hdx * hdx + hdz * hdz);
      if (hd > 0.15) {
        const hs = Math.min(hd * 4, this.player.speed * 1.2);
        this.horseObjects[4].position.x += (hdx / hd) * hs * dt;
        this.horseObjects[4].position.z += (hdz / hd) * hs * dt;
        const tgt = Math.atan2(hdx, hdz) + Math.PI;
        let d = tgt - this.horseObjects[4].rotation.y;
        while (d >  Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        this.horseObjects[4].rotation.y += d * 0.12;
      }
    }
  },

  // ── BUILD SINGLE HORSE ────────────────────────────────────
  buildHorse(x, z) {
    const group = new THREE.Group();
    const brownMat = new THREE.MeshStandardMaterial({ color: 0x7a3a10, roughness: 0.9 });
    const darkMat  = new THREE.MeshStandardMaterial({ color: 0x3a1a05, roughness: 0.9 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 1.1), brownMat);
    body.position.set(0, 0.7, 0);
    body.castShadow = true;
    group.add(body);

    // Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), brownMat);
    neck.position.set(0, 0.98, -0.42);
    neck.rotation.x = -0.35;
    neck.castShadow = true;
    group.add(neck);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.38), brownMat);
    head.position.set(0, 1.22, -0.6);
    head.castShadow = true;
    group.add(head);

    // Ears
    const earGeo = new THREE.BoxGeometry(0.05, 0.1, 0.05);
    [-0.07, 0.07].forEach(ex => {
      const ear = new THREE.Mesh(earGeo, brownMat);
      ear.position.set(ex, 1.36, -0.58);
      group.add(ear);
    });

    // Legs (4)
    const legGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    [[-0.18, -0.4], [0.18, -0.4], [-0.18, 0.4], [0.18, 0.4]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, darkMat);
      leg.position.set(lx, 0.25, lz);
      leg.castShadow = true;
      group.add(leg);
    });

    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), darkMat);
    tail.position.set(0, 0.78, 0.57);
    tail.rotation.x = 0.5;
    group.add(tail);

    group.position.set(x, 0, z);
    this.scene.add(group);
    return group;
  },

  // ── BUILD ALL 5 HORSES AT STABLE ──────────────────────────
  buildHorses() {
    const sx = 18, sz = 44;
    const positions = [
      [sx - 1, sz + 1], [sx + 1, sz + 1],
      [sx - 2, sz - 1], [sx + 2, sz - 1],
      [sx,     sz - 2],
    ];
    this.horseObjects = [];
    for (const [hx, hz] of positions) {
      this.horseObjects.push(this.buildHorse(hx, hz));
    }
    this.showNotification('5 horses ready at the stable!\nThey will follow you south.');
  },

  // ── SHOW YES/NO CHOICE ────────────────────────────────────
  showChoice(question, yesLabel, noLabel, yesCallback, noCallback) {
    this.choiceActive = true;

    const overlay = document.createElement('div');
    overlay.id = 'choice-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:40',
      'background:rgba(0,0,0,0.6)',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'gap:18px',
    ].join(';');

    const box = document.createElement('div');
    box.style.cssText = [
      'background:rgba(8,6,2,0.97)',
      'border:2px solid #c9a84c',
      'border-radius:14px',
      'padding:28px 36px',
      'text-align:center',
      'max-width:360px',
      'box-shadow:0 0 30px rgba(0,0,0,0.8)',
    ].join(';');

    const qText = document.createElement('div');
    qText.textContent = question;
    qText.style.cssText = 'font-family:Crimson Text,Georgia,serif;font-size:1.1rem;color:#f5ecd0;line-height:1.6;margin-bottom:20px;';
    box.appendChild(qText);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:16px;justify-content:center;';

    const yesBtn = document.createElement('button');
    yesBtn.textContent = yesLabel;
    yesBtn.style.cssText = [
      'padding:10px 24px', 'border-radius:8px',
      'background:rgba(80,160,80,0.3)', 'border:1.5px solid #80c080',
      'color:#a0e0a0', 'font-family:Cinzel,serif', 'font-size:0.9rem',
      'cursor:pointer', 'letter-spacing:0.05em',
    ].join(';');

    const noBtn = document.createElement('button');
    noBtn.textContent = noLabel;
    noBtn.style.cssText = [
      'padding:10px 24px', 'border-radius:8px',
      'background:rgba(160,60,60,0.3)', 'border:1.5px solid #c07070',
      'color:#e0a0a0', 'font-family:Cinzel,serif', 'font-size:0.9rem',
      'cursor:pointer', 'letter-spacing:0.05em',
    ].join(';');

    const dismiss = (cb) => {
      overlay.remove();
      this.choiceActive = false;
      this.interactCooldown = 0.5;
      if (cb) cb();
    };

    yesBtn.addEventListener('click',      () => dismiss(yesCallback));
    yesBtn.addEventListener('touchstart', (e) => { e.preventDefault(); dismiss(yesCallback); }, { passive: false });
    noBtn.addEventListener('click',       () => dismiss(noCallback));
    noBtn.addEventListener('touchstart',  (e) => { e.preventDefault(); dismiss(noCallback);  }, { passive: false });

    btnRow.appendChild(yesBtn);
    btnRow.appendChild(noBtn);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  },

  // ── NEEDLE THREADING MINI-GAME ────────────────────────────
  // ── LETTER-SEALING MINIGAME ────────────────────────────────
  startSealingMinigame(onSuccess) {
    this.minigameActive = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:60',
      'background:rgba(0,0,0,0.88)',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'gap:14px',
    ].join(';');

    const title = document.createElement('div');
    title.textContent = 'Seal the Letters';
    title.style.cssText = 'font-family:Cinzel,serif;color:#c9a84c;font-size:1.5rem;font-weight:700;letter-spacing:0.1em;text-shadow:0 0 12px rgba(201,168,76,0.5);';
    overlay.appendChild(title);

    const instr = document.createElement('div');
    instr.textContent = 'Press [E] / Tap when the seal stamp touches the target!';
    instr.style.cssText = 'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#f0e0b0;font-size:1rem;';
    overlay.appendChild(instr);

    const canvas = document.createElement('canvas');
    canvas.width  = 300;
    canvas.height = 220;
    canvas.style.cssText = 'border:2px solid #c9a84c;border-radius:8px;cursor:pointer;touch-action:none;';
    overlay.appendChild(canvas);

    const status = document.createElement('div');
    status.style.cssText = 'font-family:Cinzel,serif;color:#a07830;font-size:0.9rem;letter-spacing:0.05em;min-height:1.2em;';
    overlay.appendChild(status);

    document.body.appendChild(overlay);

    const ctx  = canvas.getContext('2d');
    const W = 300, H = 220;
    const targets  = [70, 150, 230];   // x positions of 3 seal spots
    const TARGET_Y = 160;
    let sealed = 0, phase = 0, done = false, rafId = null;

    const draw = () => {
      if (done) return;
      phase += 0.045;
      const stampX = targets[sealed] || W / 2;
      const stampY = 30 + Math.abs(Math.sin(phase * 2.2)) * 145;
      const onTarget = stampY > TARGET_Y - 18;

      // Parchment
      ctx.fillStyle = '#f0e6b8';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#b8902a';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, W - 16, H - 16);

      // Header text
      ctx.fillStyle = '#5a2e08';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2014 By Authority of the Sanhedrin \u2014', W / 2, 22);

      // Ruled lines (letter body)
      ctx.fillStyle = 'rgba(100,60,10,0.15)';
      for (let i = 0; i < 6; i++) ctx.fillRect(18, 32 + i * 16, W - 36, 7);

      // Seal target circles
      for (let i = 0; i < 3; i++) {
        const tx = targets[i];
        if (i < sealed) {
          // Sealed — dark red wax
          ctx.fillStyle = '#7a1010';
          ctx.beginPath(); ctx.arc(tx, TARGET_Y, 15, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#d4a030'; ctx.lineWidth = 1.5;
          for (let r = 0; r < 6; r++) {
            const a = (r / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(tx, TARGET_Y);
            ctx.lineTo(tx + Math.cos(a) * 11, TARGET_Y + Math.sin(a) * 11);
            ctx.stroke();
          }
          ctx.fillStyle = '#d4a030';
          ctx.font = 'bold 9px Cinzel, serif';
          ctx.fillText('\u2605', tx, TARGET_Y + 4);
        } else if (i === sealed) {
          // Active target
          ctx.fillStyle = onTarget ? 'rgba(180,40,40,0.25)' : 'rgba(180,130,40,0.18)';
          ctx.beginPath(); ctx.arc(tx, TARGET_Y, 16, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = onTarget ? '#e04040' : '#c0902a';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(tx, TARGET_Y, 14, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(140,90,20,0.28)';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(tx, TARGET_Y, 14, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // Stamp tool
      if (sealed < 3) {
        ctx.fillStyle = '#4a2008';
        ctx.fillRect(stampX - 9, stampY - 30, 18, 24);
        ctx.fillStyle = onTarget ? '#c02020' : '#8b1818';
        ctx.beginPath(); ctx.arc(stampX, stampY, 11, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d4a030'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(stampX, stampY, 7, 0, Math.PI * 2); ctx.stroke();
      }

      // Progress
      ctx.fillStyle = '#5a2e08';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Seals: ' + sealed + ' / 3', W / 2, H - 8);

      rafId = requestAnimationFrame(draw);
    };

    const tryStamp = () => {
      if (done || sealed >= 3) return;
      const stampY = 30 + Math.abs(Math.sin(phase * 2.2)) * 145;
      if (stampY > TARGET_Y - 18) {
        sealed++;
        if (sealed >= 3) {
          done = true;
          cancelAnimationFrame(rafId);
          // Final render showing all sealed
          phase = Math.PI / 2 * 2.2; // force stamp down
          draw();
          status.textContent = 'Letters sealed with the authority of the Sanhedrin!';
          status.style.color = '#80c060';
          setTimeout(() => {
            overlay.remove();
            this.minigameActive = false;
            onSuccess();
          }, 1100);
        }
      } else {
        canvas.style.borderColor = '#ff5040';
        status.textContent = 'Not yet \u2014 wait for the stamp to reach the seal!';
        status.style.color = '#c04040';
        setTimeout(() => {
          canvas.style.borderColor = '#c9a84c';
          status.textContent = '';
        }, 700);
      }
    };

    canvas.addEventListener('pointerdown', tryStamp);
    const keyH = (e) => {
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') { e.preventDefault(); tryStamp(); }
      if (e.key === 'Escape') {
        done = true; cancelAnimationFrame(rafId);
        overlay.remove(); this.minigameActive = false;
        window.removeEventListener('keydown', keyH);
        onSuccess(); // skip minigame on Escape
      }
      if (done) window.removeEventListener('keydown', keyH);
    };
    window.addEventListener('keydown', keyH);
    requestAnimationFrame(draw);
  },

  startWeavingMinigame(onSuccess, onFail) {
    this.minigameActive = true;

    const overlay = document.createElement('div');
    overlay.id = 'minigame-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:60',
      'background:rgba(0,0,0,0.88)',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'gap:14px',
    ].join(';');

    const title = document.createElement('div');
    title.textContent = 'Thread the Needle';
    title.style.cssText = 'font-family:Cinzel,serif;color:#c9a84c;font-size:1.5rem;font-weight:700;letter-spacing:0.1em;text-shadow:0 0 12px rgba(201,168,76,0.5);';
    overlay.appendChild(title);

    const instr = document.createElement('div');
    instr.textContent = 'Press [E] / Tap when the thread enters the needle eye!';
    instr.style.cssText = 'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#f0e0b0;font-size:1rem;';
    overlay.appendChild(instr);

    const canvas = document.createElement('canvas');
    canvas.width  = 340;
    canvas.height = 200;
    canvas.style.cssText = 'border:2px solid #c9a84c;border-radius:10px;background:#12100a;cursor:pointer;touch-action:none;';
    overlay.appendChild(canvas);

    const status = document.createElement('div');
    status.style.cssText = 'font-family:Cinzel,serif;color:#a07830;font-size:0.9rem;letter-spacing:0.05em;';
    overlay.appendChild(status);

    document.body.appendChild(overlay);

    const ctx = canvas.getContext('2d');
    const NX = 170, NY = 100;
    const EYE_H = 20, EYE_W = 8; // needle eye dimensions
    let phase = 0, attemptsLeft = 4, done = false;
    let rafId = null;

    const draw = () => {
      ctx.clearRect(0, 0, 340, 200);

      // Thread x position (moves left-right)
      const threadX = NX + Math.sin(phase) * 120;
      const inEye = Math.abs(threadX - NX) < EYE_W;

      // Green zone
      ctx.fillStyle = 'rgba(60,200,60,0.12)';
      ctx.fillRect(NX - EYE_W, 0, EYE_W * 2, 200);
      ctx.strokeStyle = 'rgba(60,200,60,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(NX - EYE_W, 0, EYE_W * 2, 200);

      // Needle shaft
      ctx.fillStyle = '#d4c070';
      ctx.fillRect(NX - 4, 15, 8, 170);

      // Needle eye cutout (dark hole)
      ctx.fillStyle = '#12100a';
      ctx.fillRect(NX - EYE_W, NY - EYE_H / 2, EYE_W * 2, EYE_H);
      ctx.strokeStyle = '#8a7030';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(NX - EYE_W, NY - EYE_H / 2, EYE_W * 2, EYE_H);

      // Needle point
      ctx.fillStyle = '#d4c070';
      ctx.beginPath();
      ctx.moveTo(NX - 4, 185);
      ctx.lineTo(NX + 4, 185);
      ctx.lineTo(NX, 198);
      ctx.fill();

      // Thread line
      ctx.strokeStyle = inEye ? '#60ff80' : '#c8a040';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(threadX, 0);
      ctx.lineTo(threadX, 200);
      ctx.stroke();

      // Thread dot
      ctx.fillStyle = inEye ? '#60ff80' : '#ffe060';
      ctx.beginPath();
      ctx.arc(threadX, NY, 6, 0, Math.PI * 2);
      ctx.fill();

      status.textContent = 'Attempts: ' + attemptsLeft;

      if (!done) {
        phase += 0.038;
        rafId = requestAnimationFrame(draw);
      }
    };

    const tryThread = () => {
      if (done) return;
      const threadX = NX + Math.sin(phase) * 120;
      const inEye   = Math.abs(threadX - NX) < EYE_W;

      if (inEye) {
        done = true;
        cancelAnimationFrame(rafId);
        canvas.style.borderColor = '#60ff80';
        status.textContent = 'Threaded! Well done!';
        status.style.color = '#60ff80';
        setTimeout(() => {
          overlay.remove();
          this.minigameActive = false;
          onSuccess();
        }, 700);
      } else {
        attemptsLeft--;
        canvas.style.borderColor = '#ff4040';
        setTimeout(() => { canvas.style.borderColor = '#c9a84c'; }, 300);
        if (attemptsLeft <= 0) {
          done = true;
          cancelAnimationFrame(rafId);
          status.textContent = 'Missed — speak to Benjamin to try again.';
          status.style.color = '#ff8080';
          setTimeout(() => {
            overlay.remove();
            this.minigameActive = false;
            onFail();
          }, 1200);
        }
      }
    };

    canvas.addEventListener('click', tryThread);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); tryThread(); }, { passive: false });

    const keyHandler = (e) => {
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        e.preventDefault();
        tryThread();
        if (done) window.removeEventListener('keydown', keyHandler);
      }
      if (e.key === 'Escape') {
        done = true;
        cancelAnimationFrame(rafId);
        overlay.remove();
        this.minigameActive = false;
        window.removeEventListener('keydown', keyHandler);
        onFail();
      }
    };
    window.addEventListener('keydown', keyHandler);

    draw();
  },

  // ── COMPASS (static — N always = up on screen = world north) ──
  updateCompass() { /* static compass — no rotation needed */ },

  // ── SATCHEL HUD ───────────────────────────────────────────
  updateSatchelHUD() {
    // Show satchel button when player has letters
    const btn = document.getElementById('satchel-btn');
    if (btn && this.hasLetters) btn.classList.remove('hidden');

    // Badge count = total items
    const count = (this.hasLetters ? 1 : 0) + this.inventory.tentCloth + this.inventory.tents;
    const badge = document.getElementById('satchel-badge');
    if (badge) badge.textContent = count;

    // Update popup items if open
    const elLetters = document.getElementById('sp-letters');
    const elCloth   = document.getElementById('sp-cloth');
    const elTents   = document.getElementById('sp-tents');
    const elCC      = document.getElementById('sp-cloth-count');
    const elTC      = document.getElementById('sp-tent-count');
    const elShekels = document.getElementById('sp-shekels');

    if (elLetters) elLetters.style.opacity = this.hasLetters ? '1' : '0.3';
    if (elCloth && elCC) {
      elCC.textContent = this.inventory.tentCloth;
      elCloth.style.opacity = this.inventory.tentCloth > 0 ? '1' : '0.3';
    }
    if (elTents && elTC) {
      elTC.textContent = this.inventory.tents;
      elTents.style.opacity = this.inventory.tents > 0 ? '1' : '0.3';
    }
    if (elShekels) elShekels.textContent = this.inventory.shekels;
  },

  openSatchel() {
    const popup = document.getElementById('satchel-popup');
    if (!popup) return;
    this.updateSatchelHUD();
    popup.classList.remove('hidden');
  },

  closeSatchel() {
    const popup = document.getElementById('satchel-popup');
    if (popup) popup.classList.add('hidden');
  },

  // ════════════════════════════════════════════════════════════
  //  PAUL'S FIRST MISSIONARY JOURNEY — Acts 13-14
  // ════════════════════════════════════════════════════════════

  // ── SCENE TEARDOWN HELPER ────────────────────────────────
  teardownScene() {
    // If Paul was mounted on a horse (after Damascus/Mountain runner),
    // rebuild the playerGroup fresh so RPG scenes have correct appearance
    if (this.runnerPaulRider) {
      // Remove the old playerGroup from scene entirely; rebuild clean
      if (this.playerGroup && this.playerGroup.parent) {
        this.playerGroup.parent.remove(this.playerGroup);
      }
      this.runnerPaulRider = null;
      this.runnerHorse     = null;
      this.buildPlayer(); // rebuild Paul's mesh from scratch
    }

    const toRemove = [];
    for (const ch of this.scene.children) {
      if (!ch.isLight) toRemove.push(ch);
    }
    toRemove.forEach(o => this.scene.remove(o));
    this.scene.add(this.playerGroup);

    // Clear dynamic NPC registry
    this.npcObjects   = {};
    this.signObjects  = [];
    this.lampLights   = [];
    this.npcPatrolStates = {};
    this.dustParticles.forEach(d => { try { d.mesh.geometry.dispose(); d.mesh.material.dispose(); } catch(e){} });
    this.dustParticles = [];
  },

  // ── RESET RUNNER HUD ─────────────────────────────────────
  showRPGHud() {
    document.getElementById('hud').style.display   = '';
    document.getElementById('runner-hud').classList.add('hidden');
    document.getElementById('jump-btn').style.display = 'none';
    const rb = document.getElementById('runner-btns');
    if (rb) rb.classList.add('hidden');
    const dp = document.getElementById('damascus-progress');
    if (dp) dp.style.display = 'none';
    const rm = document.getElementById('runner-multiplier');
    if (rm) rm.style.display = 'none';
    const sh = document.getElementById('sea-hud');
    if (sh) sh.classList.add('hidden');
  },

  // ── ADD STANDARD LIGHTS ──────────────────────────────────
  addSceneLights(skyColor, sunColor, sunX, sunY, sunZ) {
    const hemi = new THREE.HemisphereLight(skyColor || 0xffeebb, 0xb09060, 0.6);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(sunColor || 0xffe090, 1.6);
    sun.position.set(sunX || 40, sunY || 30, sunZ || 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -50;
    sun.shadow.camera.right = sun.shadow.camera.top = 50;
    sun.shadow.camera.far = 120;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc0a080, 0.25);
    fill.position.set(-15, 10, -15);
    this.scene.add(fill);
  },

  // ── BUILD GENERIC GROUND ─────────────────────────────────
  addGround(color, size) {
    const g = new THREE.Mesh(
      new THREE.PlaneGeometry(size || 200, size || 200),
      new THREE.MeshStandardMaterial({ color: color || 0xc4956a, roughness: 0.95 })
    );
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    this.scene.add(g);
    return g;
  },

  // ── ADD BUILDING HELPER ──────────────────────────────────
  addBox(x, y, z, w, h, d, color, castShadow) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.88 })
    );
    m.position.set(x, y, z);
    if (castShadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    this.scene.add(m);
    return m;
  },

  // ── SPAWN NPC INTO SCENE ─────────────────────────────────
  spawnNPC(npcData) {
    const group = this.createNPCGroup(npcData);
    group.position.set(npcData.x, 0, npcData.z);
    this.npcObjects[npcData.id] = { group, data: npcData };
    this.scene.add(group);
  },

  // ═══════════════════════════════════════
  //  1. ANTIOCH OF SYRIA HUB
  // ═══════════════════════════════════════
  loadAntioch() {
    this.currentScene = 'antioch';
    this.journeyPhase = 2;
    this.teardownScene();
    this.runnerActive    = false;
    this.voyageActive    = false;
    this.mtnPassActive   = false;
    this.antiochActive   = true;
    this.antiochLeadersMet = 0;
    this.antiochAllMet   = false;
    this.antiochChurchEntered = false;
    this.antiochNPCsMet  = {};

    // Atmosphere
    this.scene.background = new THREE.Color(0x87b3d4);
    this.scene.fog         = new THREE.FogExp2(0xd4c8a0, 0.022);

    this.addSceneLights(0xc8dff0, 0xffe0a0, 60, 40, 30);
    this.addGround(0xd4b87a);

    this.buildAntiochWorld();

    // Spawn NPCs
    const antiochNPCs = [
      { id: 'barnabas_antioch', name: 'Barnabas', trueName: 'Barnabas',
        x: 5, z: 8,
        bodyColor: 0x8a5c2c, accentColor: 0xc49050, headColor: 0xb07840,
        dialogues: [
          { speaker: 'Barnabas', text: '"Brother Paul! You have arrived at last. Antioch is unlike Jerusalem — here Jews and Greeks worship side by side. It was here we were first called Christians." — Acts 11:26' },
          { speaker: 'Barnabas', text: '"The church is strong here, but the Spirit is moving us outward. There are islands and cities that have never heard the Name."' },
        ],
        onComplete: 'antioch_leader',
      },
      { id: 'simeon_niger', name: 'Simeon called Niger',
        x: -6, z: 12,
        bodyColor: 0x2a1a0a, accentColor: 0x5a3a1a, headColor: 0x3a2010,
        dialogues: [
          { speaker: 'Simeon called Niger', text: '"Shalom, Paul. I am Simeon, called Niger. I came to faith through the scattered believers who fled Jerusalem after Stephen\'s death." — Acts 11:19-20' },
          { speaker: 'Simeon called Niger', text: '"This church is proof — the Spirit does not distinguish by nation or skin. We are all one in Christ."' },
        ],
        onComplete: 'antioch_leader',
      },
      { id: 'lucius_cyrene', name: 'Lucius of Cyrene',
        x: 8, z: 15,
        bodyColor: 0x6a4a2a, accentColor: 0x9a7050, headColor: 0xa07040,
        dialogues: [
          { speaker: 'Lucius of Cyrene', text: '"Paul — I am Lucius, from Cyrene on the Libyan coast. I came to Antioch years ago. It is a city of two worlds — Roman and Greek on one side, Jewish and Syrian on the other."' },
          { speaker: 'Lucius of Cyrene', text: '"The Spirit of God is doing something new here. Something that even Jerusalem has not seen."' },
        ],
        onComplete: 'antioch_leader',
      },
      { id: 'manaen', name: 'Manaen',
        x: -4, z: 6,
        bodyColor: 0x4a3a6a, accentColor: 0x8a6aaa, headColor: 0xb09060,
        dialogues: [
          { speaker: 'Manaen', text: '"Paul. I am Manaen — I grew up in the court of Herod Antipas, the very man who beheaded John the Baptist. Yet here I stand, a servant of the living God."' },
          { speaker: 'Manaen', text: '"God\'s grace reaches even into the palaces of kings. No one is beyond the reach of the Spirit." — Acts 13:1' },
        ],
        onComplete: 'antioch_leader',
      },
      { id: 'john_mark', name: 'John Mark',
        x: 2, z: 18,
        bodyColor: 0x5a7a4a, accentColor: 0x8aaa70, headColor: 0xb09060,
        dialogues: [
          { speaker: 'John Mark', text: '"Cousin Barnabas says I am to travel with you and serve as your helper. I am ready — I have seen much already. My mother\'s home in Jerusalem was a gathering place for the church."' },
          { speaker: 'John Mark', text: '"I will carry what is needed. Where we go, I will go." — Acts 13:5' },
        ],
        onComplete: 'antioch_leader',
      },
      { id: 'antioch_believer1', name: 'Believer',
        x: -8, z: 20,
        bodyColor: 0x7a6040, accentColor: 0xaa8060, headColor: 0xb08060,
        dialogues: [
          { speaker: 'Believer', text: '"We have been praying and fasting for days now. The Spirit spoke clearly — Barnabas and Paul are set apart for a special work." — Acts 13:2-3' },
          { speaker: 'Believer', text: '"May God go with you on the road ahead."' },
        ],
      },
      { id: 'antioch_believer2', name: 'Believer',
        x: 12, z: 10,
        bodyColor: 0x8a7050, accentColor: 0xba9070, headColor: 0xc09060,
        dialogues: [
          { speaker: 'Believer', text: '"Antioch — the third city of the empire, and the heart of the new faith. People come from everywhere and find the same Lord."' },
        ],
      },
    ];

    for (const npc of antiochNPCs) {
      this.spawnNPC(npc);
    }

    // Player placement
    this.player.pos.set(0, 0, 25);
    this.playerGroup.position.set(0, 0, 25);
    this.playerGroup.rotation.y = Math.PI;
    this.cam.pos.set(0, 9, 37);

    this.showRPGHud();
    document.getElementById('location-name').textContent = 'Antioch of Syria';
    if (this.elScriptureRef) this.elScriptureRef.textContent = 'Acts 13:1-3';
    if (this.elQuestText) this.elQuestText.textContent = 'Meet the five church leaders';

    this.showQuestPopup(
      'Antioch of Syria — The Holy Spirit Is Moving',
      'Meet the leaders of the church. The Spirit is about to send you on a historic mission.',
      'Acts 13:1-3'
    );
  },

  buildAntiochWorld() {
    const tan    = 0xc4a870;
    const brown  = 0x7a5a30;
    const wall   = 0xc8b078;
    const roofC  = 0x9a7848;

    // City walls
    this.addBox( 22, 1.5, 12, 2, 3, 40, wall);   // east wall
    this.addBox(-22, 1.5, 12, 2, 3, 40, wall);   // west wall
    this.addBox(  0, 1.5,-16, 44, 3, 2, wall);   // north wall
    this.addBox(  0, 1.5, 34, 44, 3, 2, wall);   // south wall (port road exit gap at center)

    // Syrian mud-brick buildings (varied sizes)
    const buildings = [
      { x: 16, z:  4, w: 8, h: 4, d: 6 },
      { x:-16, z:  4, w: 7, h: 3.5, d: 5 },
      { x: 15, z: 22, w: 7, h: 3, d: 8 },
      { x:-15, z: 22, w: 6, h: 4, d: 7 },
      { x: 16, z:-10, w: 8, h: 4, d: 6 },
      { x:-16, z:-10, w: 7, h: 3.5, d: 5 },
      { x:  0, z:-10, w: 6, h: 3, d: 5 },
    ];
    for (const b of buildings) {
      this.addBox(b.x, b.h/2, b.z, b.w, b.h, b.d, tan);
      this.addBox(b.x, b.h + 0.12, b.z, b.w + 0.2, 0.24, b.d + 0.2, roofC);
    }

    // Church building (central-north) — larger with cross detail
    this.addBox(0, 2.5, -4, 10, 5, 8, 0xd4c08a);
    this.addBox(0, 5.12, -4, 10.2, 0.24, 8.2, 0xb09060);   // roof
    // Cross on roof
    this.addBox(0, 6.0, -4, 0.35, 1.5, 0.35, 0xd4a830);   // vertical
    this.addBox(0, 6.5, -4, 1.1,  0.35, 0.35, 0xd4a830);   // horizontal
    // Church door marker (darker patch)
    this.addBox(0, 1.2, -0.05, 1.4, 2.4, 0.15, 0x5a3a18);

    // Market stalls
    for (let i = -1; i <= 1; i++) {
      this.addBox(i * 5, 1.0, 28, 2, 0.1, 1.3, 0x9a7040);   // table
      this.addBox(i * 5, 2.1, 28, 2.5, 0.12, 1.6, [0xcc6030, 0x408040, 0x4040a0][i+1]);  // awning
    }

    // River strip in far north
    const riverMat = new THREE.MeshStandardMaterial({ color: 0x4a8ab0, roughness: 0.3, metalness: 0.1 });
    const river = new THREE.Mesh(new THREE.PlaneGeometry(60, 8), riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, 0.05, -22);
    this.scene.add(river);

    // Road south to port (Seleucia gate)
    this.addBox(0, 0.05, 30, 5, 0.1, 8, 0xc0a060);   // road
    // Port gate pillars
    this.addBox(-3.5, 2.5, 34, 1, 5, 1, 0xb09060);
    this.addBox( 3.5, 2.5, 34, 1, 5, 1, 0xb09060);
    this.addBox(   0, 5.2, 34, 8, 0.4, 1, 0xb09060);  // lintel

    // Palm trees
    const palmSpots = [[-10,-8],[10,-8],[-18,18],[18,18],[-5,28],[5,28]];
    for (const [px, pz] of palmSpots) this.addPalm(px, pz);

    // Lamp posts
    const lamps = [[-8,8],[8,8],[-8,20],[8,20],[0,0]];
    for (const [lx,lz] of lamps) this.addDecoration({ type:'lamp', x:lx, z:lz });
  },

  updateAntiochChecks(pos) {
    // Church door entry check
    if (!this.antiochChurchEntered && !this.dialogueActive && !this.choiceActive &&
        Math.abs(pos.x) < 1.5 && pos.z > -3 && pos.z < 1) {
      this.antiochChurchEntered = true;
      if (this.antiochAllMet) {
        this.showCommissioningScene();
      } else {
        const remaining = 5 - this.antiochLeadersMet;
        this.showNotification('The church gathers here to pray.\nMeet all ' + remaining + ' more leader(s) first.');
        this.antiochChurchEntered = false; // allow re-entry
      }
    }

    // Port gate departure (after commissioning)
    if (this.antiochCommissioned && pos.z > 36 && !this.voyageActive) {
      this.loadSeaVoyage();
    }
  },

  showCommissioningScene() {
    this.antiochCommissioned = true;
    this.dialogueActive = true;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Cinzel,serif;text-align:center;padding:40px;transition:background 1.5s ease;';
    document.body.appendChild(ov);
    requestAnimationFrame(() => { ov.style.background = 'rgba(0,0,0,0.92)'; });

    const mk = (html, css) => {
      const d = document.createElement('div');
      d.innerHTML = html;
      d.style.cssText = css + 'opacity:0;transition:opacity 1.2s ease;';
      ov.appendChild(d);
      return d;
    };

    const t1 = mk('The Commissioning', 'color:#c9a84c;font-size:clamp(1.8rem,5vw,2.5rem);font-weight:700;letter-spacing:0.12em;margin-bottom:8px;');
    const t2 = mk('"While they were worshipping the Lord and fasting, the Holy Spirit said:<br><em>\'Set apart for me Barnabas and Saul for the work to which I have called them.\'"</em>',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#f0e0b0;font-size:clamp(0.95rem,2.4vw,1.15rem);max-width:520px;line-height:1.9;margin-bottom:16px;');
    const t3 = mk('<span style="font-size:0.82em;color:#9a8050">— Acts 13:2</span>',
      'color:#9a8050;margin-bottom:28px;');
    const t4 = mk('"They fasted and prayed, laid hands on them, and sent them off." — Acts 13:3',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#c8b880;font-size:clamp(0.85rem,2.2vw,1rem);max-width:460px;line-height:1.8;margin-bottom:28px;');
    const t5 = mk('&#9654; Destination: Cyprus', 'color:#7ab0d4;font-size:clamp(1rem,2.8vw,1.3rem);letter-spacing:0.18em;');

    setTimeout(() => { t1.style.opacity = '1'; }, 600);
    setTimeout(() => { t2.style.opacity = '1'; }, 1400);
    setTimeout(() => { t3.style.opacity = '1'; }, 2200);
    setTimeout(() => { t4.style.opacity = '1'; }, 3000);
    setTimeout(() => { t5.style.opacity = '1'; }, 4000);

    setTimeout(() => {
      ov.style.transition = 'opacity 1.5s ease';
      ov.style.opacity = '0';
      setTimeout(() => {
        if (ov.parentNode) ov.remove();
        this.dialogueActive = false;
        this.showNotification('Walk south through the port gate\nto set sail for Cyprus!');
        if (this.elQuestText) this.elQuestText.textContent = 'Go to the Seleucia port gate';
      }, 1600);
    }, 6000);
  },

  // ═══════════════════════════════════════
  //  2. SEA VOYAGE MINI-GAME
  // ═══════════════════════════════════════
  loadSeaVoyage() {
    this.currentScene = 'sea';
    this.journeyPhase = 3;
    this.teardownScene();
    this.antiochActive  = false;
    this.runnerActive   = false;
    this.mtnPassActive  = false;
    this.voyageActive   = true;
    this.voyageTime     = 0;
    this.voyageTimeLimit = 75;
    this.voyageLives    = 3;
    this.voyageFinished = false;
    this.voyageBoatX    = 0;
    this.voyageBoatTargetX = 0;
    this.voyageSpeed    = 3.5;
    this.voyageInvincible = 0;
    this.voyageObstacles = [];
    this.voyageScrolls   = [];
    this.voyagePrevJoy   = false;

    // Sea atmosphere
    this.scene.background = new THREE.Color(0x1a5a8a);
    this.scene.fog = new THREE.FogExp2(0x1a5a8a, 0.018);

    const hemi = new THREE.HemisphereLight(0x7ab8e0, 0x204070, 0.8);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe080, 1.4);
    sun.position.set(80, 60, -50);
    this.scene.add(sun);

    // Build ocean waves (flat animated planes at varying heights)
    this.voyageWaves = [];
    for (let i = 0; i < 14; i++) {
      const wGeo = new THREE.PlaneGeometry(30 + Math.random() * 20, 3 + Math.random() * 2);
      const wMat = new THREE.MeshStandardMaterial({
        color: 0x1a6aaa, roughness: 0.3, metalness: 0.15,
        transparent: true, opacity: 0.7 + Math.random() * 0.25,
      });
      const wave = new THREE.Mesh(wGeo, wMat);
      wave.rotation.x = -Math.PI / 2;
      wave.position.set((Math.random() - 0.5) * 40, -0.1, (Math.random() - 0.5) * 50 + 10);
      wave._phase = Math.random() * Math.PI * 2;
      wave._amp   = 0.12 + Math.random() * 0.1;
      this.scene.add(wave);
      this.voyageWaves.push(wave);
    }

    // Build boat
    const boatGrp = new THREE.Group();
    // Hull
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.6, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x7a5020, roughness: 0.9 })
    );
    hull.position.y = 0.3;
    boatGrp.add(hull);
    // Mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a3010 })
    );
    mast.position.set(0, 2.2, 0);
    boatGrp.add(mast);
    // Sail
    const sailGeo = new THREE.BufferGeometry();
    const sailVerts = new Float32Array([0,0,0, 0,2.4,0, 1.4,0,0]);
    sailGeo.setAttribute('position', new THREE.BufferAttribute(sailVerts, 3));
    sailGeo.setIndex([0,1,2]);
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: 0xe8d8b0, side: THREE.DoubleSide }));
    sail.position.set(0, 0.8, 0);
    boatGrp.add(sail);

    boatGrp.position.set(0, 0.2, 5);
    boatGrp.rotation.y = Math.PI;
    this.voyageBoat = boatGrp;
    this.scene.add(boatGrp);

    // Rocks
    for (let i = 0; i < 6; i++) {
      const r = 0.5 + Math.random() * 0.4;
      const rock = new THREE.Mesh(
        new THREE.SphereGeometry(r, 7, 6),
        new THREE.MeshStandardMaterial({ color: 0x707060, roughness: 0.95 })
      );
      rock.position.set(
        (Math.random() - 0.5) * 12,
        0.1,
        -15 - i * 12 + Math.random() * 6
      );
      rock._r = r + 0.5;
      this.voyageObstacles.push(rock);
      this.scene.add(rock);
    }

    // Cyprus island (far end)
    const islandGrp = new THREE.Group();
    const isl = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4b87a, roughness: 0.95 })
    );
    isl.position.y = 0;
    islandGrp.add(isl);
    // Some hills
    for (let i = 0; i < 5; i++) {
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + Math.random(), 7, 6),
        new THREE.MeshStandardMaterial({ color: 0x7a9a50, roughness: 0.9 })
      );
      hill.position.set((Math.random()-0.5)*12, 1.2, (Math.random()-0.5)*6);
      islandGrp.add(hill);
    }
    islandGrp.position.set(0, 0, -90);
    this.scene.add(islandGrp);
    this.voyageCyprus = islandGrp;

    // Camera for top-down voyage view
    this.player.pos.set(0, 10, 20);
    this.cam.pos.set(0, 18, 22);
    this.camera.position.set(0, 18, 22);
    this.camera.lookAt(0, 0, 0);

    // HUD
    document.getElementById('hud').style.display = 'none';
    const seaHud = document.getElementById('sea-hud');
    if (seaHud) seaHud.classList.remove('hidden');
    this.updateSeaLivesHUD();

    document.getElementById('location-name').textContent = 'Seleucia \u2192 Cyprus';

    // Controls — use runner lane system repurposed for X movement
    this.initVoyageControls();

    this.showQuestPopup(
      'Seleucia to Cyprus',
      'Steer the boat to avoid rocks. Reach Cyprus safely!',
      'Acts 13:4 — 160km'
    );
  },

  updateSeaLivesHUD() {
    const el = document.getElementById('sea-lives');
    if (!el) return;
    let html = '';
    for (let i = 0; i < 3; i++) {
      html += '<span style="color:' + (i < this.voyageLives ? '#c9a84c' : '#333') + ';font-size:1.3rem;">&#9875;</span> ';
    }
    el.innerHTML = html;
  },

  initVoyageControls() {
    // Reuse existing key handler — voyageBoatTargetX updated in updateSeaVoyage
    this.voyageKeyLeft  = false;
    this.voyageKeyRight = false;
    this.voyageKeyUp    = false;
    this.voyageKeyDown  = false;
  },

  updateSeaVoyage(dt) {
    if (!this.voyageActive || this.voyageFinished || this.dialogueActive) {
      // Still animate waves
      this._animVoyageWaves(dt);
      return;
    }

    this.voyageTime += dt;
    const pct = Math.min(this.voyageTime / this.voyageTimeLimit, 1.0);

    // Progress bar
    const fill = document.getElementById('sea-progress-fill');
    if (fill) fill.style.width = (pct * 100) + '%';

    // Key / joystick input for up/down/left/right
    let dx = 0, dz = 0;
    if (this.keys['ArrowLeft']  || this.keys['a'] || this.keys['A']) dx -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) dx += 1;
    if (this.keys['ArrowUp']    || this.keys['w'] || this.keys['W']) dz -= 1;
    if (this.keys['ArrowDown']  || this.keys['s'] || this.keys['S']) dz += 1;

    if (this.joy.active && this.joy.mag > 0.15) {
      dx += Math.cos(this.joy.angle) * this.joy.mag;
      dz += Math.sin(this.joy.angle) * this.joy.mag;
    }

    // Move boat
    const bx = this.voyageBoat.position.x + dx * 5.5 * dt;
    const bz = this.voyageBoat.position.z + dz * 5.5 * dt;
    this.voyageBoat.position.x = Math.max(-9, Math.min(9, bx));
    this.voyageBoat.position.z = Math.max(-88, Math.min(12, bz));

    // Auto-advance toward Cyprus
    const autoSpeed = 3 + pct * 4;
    this.voyageBoat.position.z -= autoSpeed * dt;

    // Waves animation
    this._animVoyageWaves(dt);

    // Invincibility cooldown
    if (this.voyageInvincible > 0) this.voyageInvincible -= dt;

    // Collision with rocks
    if (this.voyageInvincible <= 0) {
      for (const rock of this.voyageObstacles) {
        const ddx = this.voyageBoat.position.x - rock.position.x;
        const ddz = this.voyageBoat.position.z - rock.position.z;
        const dist = Math.sqrt(ddx*ddx + ddz*ddz);
        if (dist < rock._r + 0.9) {
          this.voyageLives--;
          this.voyageInvincible = 2.5;
          this.updateSeaLivesHUD();
          this.showNotification('Hit a rock! ' + this.voyageLives + ' lives left.');
          // Flash boat red
          this.voyageBoat.traverse(c => { if (c.isMesh) { c._origColor = c.material.color.getHex(); c.material.color.set(0xff2020); } });
          setTimeout(() => {
            this.voyageBoat.traverse(c => { if (c.isMesh && c._origColor !== undefined) c.material.color.setHex(c._origColor); });
          }, 500);
          if (this.voyageLives <= 0) {
            this.voyageFinished = true;
            setTimeout(() => {
              this.showNotification('The voyage was rough.\nBut God is faithful.\nSailing again...');
              setTimeout(() => { this.loadSeaVoyage(); }, 2500);
            }, 500);
            return;
          }
          break;
        }
      }
    }

    // Camera follows boat
    this.camera.position.set(this.voyageBoat.position.x * 0.3, 16, this.voyageBoat.position.z + 18);
    this.camera.lookAt(this.voyageBoat.position.x, 0, this.voyageBoat.position.z - 5);

    // Reached Cyprus
    if (this.voyageBoat.position.z < -80) {
      this.voyageFinished = true;
      this.voyageActive   = false;
      this.showNotification('Cyprus in sight! Arriving at Salamis...');
      setTimeout(() => { this.loadSalamis(); }, 2500);
    }
  },

  _animVoyageWaves(dt) {
    if (!this.voyageWaves) return;
    const t = performance.now() * 0.001;
    for (const w of this.voyageWaves) {
      w.position.y = Math.sin(t * 0.8 + w._phase) * w._amp;
    }
  },

  // ═══════════════════════════════════════
  //  3. SALAMIS SYNAGOGUE
  // ═══════════════════════════════════════
  loadSalamis() {
    this.currentScene = 'salamis';
    this.journeyPhase = 4;
    this.teardownScene();
    this.voyageActive  = false;
    this.runnerActive  = false;
    this.mtnPassActive = false;

    this.scene.background = new THREE.Color(0x1a1208);
    this.scene.fog = new THREE.FogExp2(0x1a1208, 0.04);

    // Warm torchlight
    const amb = new THREE.AmbientLight(0x4a3010, 0.4);
    this.scene.add(amb);
    const torch1 = new THREE.PointLight(0xff9040, 1.2, 14);
    torch1.position.set(-6, 3.5, -5);
    this.scene.add(torch1);
    const torch2 = new THREE.PointLight(0xff9040, 1.2, 14);
    torch2.position.set( 6, 3.5, -5);
    this.scene.add(torch2);
    const torch3 = new THREE.PointLight(0xff8030, 1.0, 14);
    torch3.position.set(0, 3.5, 8);
    this.scene.add(torch3);

    // Dark wood floor
    this.addGround(0x2a1a08, 80);

    // Walls
    this.addBox(0,  2.5, -12, 22, 5, 0.5, 0x3a2810);   // front wall
    this.addBox(0,  2.5,  10, 22, 5, 0.5, 0x3a2810);   // back wall
    this.addBox(-11, 2.5,  -1, 0.5, 5, 22, 0x3a2810);  // left
    this.addBox( 11, 2.5,  -1, 0.5, 5, 22, 0x3a2810);  // right

    // Benches
    for (let i = -3; i <= 3; i += 2) {
      this.addBox(i * 1.6, 0.3, 3, 1.4, 0.3, 5.5, 0x5a3a18);
    }

    // Torah scroll cabinet
    this.addBox(0, 1.5, -10, 3.5, 3, 1.2, 0x6a4a20);
    this.addBox(0, 3.2, -10, 3.6, 0.2, 1.3, 0x5a3a10);  // top

    // Torch poles
    for (const [tx, tz] of [[-6, -5], [6, -5], [0, 8]]) {
      this.addBox(tx, 1.8, tz, 0.12, 3.5, 0.12, 0x5a3a10);
      // Flame glow sphere
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 6, 5),
        new THREE.MeshStandardMaterial({ color: 0xff8820, emissive: new THREE.Color(0xff5510), emissiveIntensity: 2 })
      );
      flame.position.set(tx, 3.5, tz);
      this.scene.add(flame);
    }

    // NPC — Synagogue Ruler
    this.spawnNPC({
      id: 'salamis_ruler', name: 'Synagogue Ruler',
      x: 0, z: -8,
      bodyColor: 0x4a3070, accentColor: 0x9a80b0, headColor: 0xb09060,
      dialogues: [
        { speaker: 'Synagogue Ruler', text: '"Visitors — you are welcome to speak if you have a word for us. We have just finished reading from Isaiah."' },
        { speaker: 'Synagogue Ruler', text: '"Paul rose and spoke of a Savior from the line of David — the synagogues of Salamis heard the message of Jesus." — Acts 13:5' },
      ],
      onComplete: 'salamis_done',
    });

    // John Mark as helper
    this.spawnNPC({
      id: 'john_mark_helper', name: 'John Mark',
      x: -4, z: -2,
      bodyColor: 0x5a7a4a, accentColor: 0x8aaa70, headColor: 0xb09060,
      dialogues: [
        { speaker: 'John Mark', text: '"John Mark served as helper to Paul and Barnabas throughout Cyprus." — Acts 13:5' },
      ],
    });

    // Player placement
    this.player.pos.set(0, 0, 8);
    this.playerGroup.position.set(0, 0, 8);
    this.playerGroup.rotation.y = Math.PI;
    this.cam.pos.set(0, 9, 20);

    this.showRPGHud();
    document.getElementById('location-name').textContent = 'Salamis, Cyprus';
    if (this.elScriptureRef) this.elScriptureRef.textContent = 'Acts 13:5';
    if (this.elQuestText) this.elQuestText.textContent = 'Speak to the Synagogue Ruler';

    this.showQuestPopup(
      'Salamis, Cyprus',
      'Paul and Barnabas proclaimed the word of God in the synagogues of the Jews.',
      'Acts 13:5'
    );
  },

  // ═══════════════════════════════════════
  //  4. PAPHOS — ELYMAS CONFRONTATION
  // ═══════════════════════════════════════
  loadPaphos() {
    this.currentScene = 'paphos';
    this.journeyPhase = 5;
    this.teardownScene();
    this.voyageActive  = false;
    this.runnerActive  = false;
    this.mtnPassActive = false;

    this.scene.background = new THREE.Color(0x6a9ab0);
    this.scene.fog = new THREE.FogExp2(0xd0e0ee, 0.018);

    this.addSceneLights(0xb0d0f0, 0xffeebb, 50, 40, 30);
    this.addGround(0xd0b890);

    this.buildPaphosWorld();

    // NPCs
    this.spawnNPC({
      id: 'sergius_paulus', name: 'Sergius Paulus',
      x: 0, z: -12,
      bodyColor: 0xc0a060, accentColor: 0x8a1818, headColor: 0xc0a070,
      dialogues: [
        { speaker: 'Sergius Paulus', text: '"I am Sergius Paulus, Proconsul of Cyprus. I have heard reports of your teaching and summoned you here myself. I am an intelligent man — I want to hear the word of God for myself." — Acts 13:7' },
        { speaker: 'Sergius Paulus', text: '"But be warned — my advisor Bar-Jesus has told me your message is dangerous. He stands ready to counter everything you say." — Acts 13:8' },
      ],
      onComplete: 'meet_proconsul',
    });

    this.spawnNPC({
      id: 'elymas', name: 'Bar-Jesus (Elymas)',
      x: 5, z: -9,
      bodyColor: 0x1a1a2a, accentColor: 0x3a3a5a, headColor: 0x8a7050,
      dialogues: [
        { speaker: 'Bar-Jesus', text: '"I am Bar-Jesus, counselor to the proconsul. I have studied the mysteries of heaven and earth for thirty years. What you teach is a dangerous delusion." — Acts 13:6' },
        { speaker: 'Bar-Jesus', text: '"You will not turn Sergius Paulus from the wisdom of the ages. Leave this place, Jew. Your prophet was executed as a criminal." — Acts 13:8' },
      ],
      onComplete: 'challenge_elymas',
    });

    // Player placement
    this.player.pos.set(0, 0, 5);
    this.playerGroup.position.set(0, 0, 5);
    this.playerGroup.rotation.y = Math.PI;
    this.cam.pos.set(0, 9, 17);

    this.showRPGHud();
    document.getElementById('location-name').textContent = 'Paphos, Cyprus';
    if (this.elScriptureRef) this.elScriptureRef.textContent = 'Acts 13:6-12';
    if (this.elQuestText) this.elQuestText.textContent = 'Meet the Proconsul';

    this.showQuestPopup(
      'Paphos, Cyprus',
      'At the western end of Cyprus, the Roman proconsul Sergius Paulus wants to hear the word of God.',
      'Acts 13:6-7'
    );
  },

  buildPaphosWorld() {
    // Roman courtyard with columns
    // Floor tiles (red/purple)
    for (let r = -3; r <= 3; r++) {
      for (let c = -6; c <= 1; c++) {
        const color = (r + c) % 2 === 0 ? 0x9a2020 : 0x7a1080;
        this.addBox(r * 2.5, 0.06, c * 2.5, 2.45, 0.12, 2.45, color, false);
      }
    }

    // Columns along sides
    for (let ci = -3; ci <= 3; ci += 1.5) {
      this.addBox(-9, 2, ci * 2.5, 0.6, 4, 0.6, 0xe0d8c8);
      this.addBox( 9, 2, ci * 2.5, 0.6, 4, 0.6, 0xe0d8c8);
      // Column capitals
      this.addBox(-9, 4.1, ci * 2.5, 0.9, 0.22, 0.9, 0xd0c8b0);
      this.addBox( 9, 4.1, ci * 2.5, 0.9, 0.22, 0.9, 0xd0c8b0);
    }

    // Grand hall front wall
    this.addBox(0, 3, -18, 20, 6, 1.5, 0xd0c8b0);
    // Pediment
    this.addBox(0, 6.5, -18, 20, 0.5, 2, 0xc0b8a0);

    // Proconsul's raised platform
    this.addBox(0, 0.25, -13, 8, 0.5, 4, 0xc8b898);

    // Throne/chair
    this.addBox(0, 0.85, -14, 1.8, 1.2, 1.8, 0x8a6820);
    this.addBox(0, 1.7, -14, 1.8, 0.2, 0.3, 0xaa8840);  // back

    // Side walls
    this.addBox(-11, 3, -7, 2, 6, 28, 0xd0c8b0);
    this.addBox( 11, 3, -7, 2, 6, 28, 0xd0c8b0);
  },

  showElymasJudgment() {
    this.elymosBlinded = true;
    this.dialogueActive = true;

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Cinzel,serif;text-align:center;padding:40px;';
    document.body.appendChild(ov);

    const mk = (html, css) => {
      const d = document.createElement('div');
      d.innerHTML = html;
      d.style.cssText = css + 'opacity:0;transition:opacity 1.2s ease;';
      ov.appendChild(d);
      return d;
    };

    const t1 = mk('"You son of the devil, you enemy of all righteousness, full of all deceit and villainy, will you not stop making crooked the straight paths of the Lord?"',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#f0d090;font-size:clamp(0.95rem,2.5vw,1.15rem);max-width:560px;line-height:1.9;margin-bottom:12px;');
    const t2 = mk('"And now, behold, the hand of the Lord is upon you, and you will be blind and unable to see the sun for a time." — Acts 13:10-11',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#e0c080;font-size:clamp(0.9rem,2.3vw,1.05rem);max-width:540px;line-height:1.8;margin-bottom:24px;');

    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;z-index:210;background:white;opacity:0;pointer-events:none;transition:opacity 0.15s;';
    document.body.appendChild(flash);

    const t3 = mk('"Immediately mist and darkness fell on him and he went about seeking people to lead him by the hand." — Acts 13:11',
      'font-family:Crimson Text,Georgia,serif;color:#c8b880;font-size:clamp(0.85rem,2.2vw,1rem);max-width:500px;line-height:1.8;margin-bottom:20px;');
    const t4 = mk('"When the proconsul saw what had occurred, he believed, astonished at the teaching of the Lord." — Acts 13:12',
      'font-family:Crimson Text,Georgia,serif;color:#90c0e0;font-size:clamp(0.85rem,2.2vw,1rem);max-width:500px;line-height:1.8;margin-bottom:20px;');
    const t5 = mk('Saul, who was also called <strong>Paul</strong>',
      'color:#c9a84c;font-size:clamp(1.2rem,3.5vw,1.8rem);font-weight:700;letter-spacing:0.12em;');
    const t6 = mk('— Acts 13:9. From this point forward, he is known as Paul.',
      'color:#9a8050;font-size:clamp(0.75rem,2vw,0.88rem);letter-spacing:0.1em;');

    setTimeout(() => { t1.style.opacity = '1'; }, 400);
    setTimeout(() => { t2.style.opacity = '1'; }, 1600);
    setTimeout(() => {
      flash.style.opacity = '1';
      setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 400); }, 250);
    }, 2800);
    setTimeout(() => { t3.style.opacity = '1'; }, 3100);
    setTimeout(() => { t4.style.opacity = '1'; }, 4200);
    setTimeout(() => { t5.style.opacity = '1'; }, 5200);
    setTimeout(() => { t6.style.opacity = '1'; }, 5900);

    this.nameChanged  = true;
    this.playerName   = 'Paul';
    this.sergiusBelieved = true;

    setTimeout(() => {
      ov.style.transition = 'opacity 1.5s';
      ov.style.opacity = '0';
      setTimeout(() => {
        if (ov.parentNode) ov.remove();
        this.dialogueActive = false;
        document.getElementById('location-name').textContent = 'Paphos — Complete';
        this.showQuestPopup(
          'Paul sets sail from Cyprus',
          'The proconsul believed. Cyprus is changed. Next: Perga in Pamphylia.',
          'Acts 13:12-13'
        );
        setTimeout(() => { this.loadPerga(); }, 1000);
      }, 1600);
    }, 7500);
  },

  // ═══════════════════════════════════════
  //  5. PERGA — JOHN MARK DEPARTS
  // ═══════════════════════════════════════
  loadPerga() {
    this.currentScene = 'perga';
    this.journeyPhase = 6;
    this.teardownScene();

    this.scene.background = new THREE.Color(0x7ab0d0);
    this.scene.fog = new THREE.FogExp2(0xd0e8f0, 0.022);

    this.addSceneLights(0xc0ddf0, 0xffe090, 40, 30, 20);
    this.addGround(0xc8b880);

    // Simple coastal buildings
    this.addBox(-8, 2, -5, 6, 4, 5, 0xd4c08a);
    this.addBox( 8, 2, -5, 6, 4, 5, 0xd4c08a);
    this.addBox( 0, 2,-10, 5, 4, 4, 0xc0aa70);

    // Road going north (inland)
    this.addBox(0, 0.05, 5, 4, 0.1, 20, 0xb0a060);

    // John Mark NPC
    this.spawnNPC({
      id: 'john_mark_perga', name: 'John Mark',
      x: -3, z: 5,
      bodyColor: 0x5a7a4a, accentColor: 0x8aaa70, headColor: 0xb09060,
      dialogues: [
        { speaker: 'John Mark', text: '"Paul... Barnabas... I cannot continue. The road ahead goes deep into the mountains — bandit country. And the mission is changing in ways I did not expect. I must return to Jerusalem." — Acts 13:13' },
        { speaker: 'John Mark', text: '"Forgive me. I did not foresee this. God willing, we will meet again."' },
      ],
      onComplete: 'john_mark_departs',
    });

    // Barnabas NPC
    this.spawnNPC({
      id: 'barnabas_perga', name: 'Barnabas',
      x: 3, z: 3,
      bodyColor: 0x8a5c2c, accentColor: 0xc49050, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Barnabas', text: '"Paul, the road to Pisidian Antioch runs through the Taurus Mountains. It will be a hard journey — but God has called us forward."' },
      ],
    });

    this.player.pos.set(0, 0, 12);
    this.playerGroup.position.set(0, 0, 12);
    this.playerGroup.rotation.y = Math.PI;
    this.cam.pos.set(0, 9, 24);

    this.showRPGHud();
    document.getElementById('location-name').textContent = 'Perga, Pamphylia';
    if (this.elScriptureRef) this.elScriptureRef.textContent = 'Acts 13:13';
    if (this.elQuestText) this.elQuestText.textContent = 'Speak to John Mark';

    this.showQuestPopup(
      'Perga — A Difficult Decision',
      'Paul and his company arrived in Perga. It was here that John Mark made a fateful decision.',
      'Acts 13:13'
    );
  },

  // ═══════════════════════════════════════
  //  6. TAURUS MOUNTAIN PASS RUNNER
  // ═══════════════════════════════════════
  loadMountainPass() {
    this.currentScene = 'mountain';
    this.journeyPhase = 6;

    this.teardownScene();
    this.voyageActive  = false;
    this.antiochActive = false;

    // Reuse the full runner system
    this.runnerActive     = true;
    this.runnerFinished   = false;
    this.runnerLane       = 1;
    this.runnerTargetLane = 1;
    this.runnerSpeed      = 7;
    this.runnerTime       = 0;
    this.runnerTimeLimit  = 90;
    this.runnerJumping    = false;
    this.runnerJumpY      = 0;
    this.runnerJumpVel    = 0;
    this.runnerLives      = 3;
    this.runnerInvincible = 0;
    this.runnerObstacles  = [];
    this.runnerCoins      = [];
    this.runnerRoadMeshes = [];
    this.runnerNextZ      = 28;
    this.runnerShake      = 0;
    this.runnerSlowed     = 0;
    this.runnerDoubleCoin = 0;
    this.runnerMultiplier = 1;
    this.runnerMultiplierTimer = 0;
    this.runnerMilestones = [30, 60, 90];
    this.runnerMilestonePrev = 0;
    this.runnerEndLight   = null;
    this.encounterTriggered = false;
    this.runnerHorse      = null;   // no horse — Paul walks
    this.runnerPaulRider  = null;
    this._runnerMtnMode   = true;

    // Grey mountain sky
    this.scene.background = new THREE.Color(0x6a7a8a);
    this.scene.fog = new THREE.Fog(0x8a9aaa, 25, 90);

    const sunLight = new THREE.DirectionalLight(0xd0d8e0, 1.2);
    sunLight.position.set(20, 40, -10);
    sunLight.castShadow = true;
    this.scene.add(sunLight);
    const ambLight = new THREE.AmbientLight(0x8090a0, 0.5);
    this.scene.add(ambLight);
    this.runnerAmbientLight = ambLight;

    // Mountain background peaks
    for (let i = -4; i <= 4; i++) {
      const h = 8 + Math.random() * 12;
      const peak = new THREE.Mesh(
        new THREE.ConeGeometry(4 + Math.random() * 3, h, 5),
        new THREE.MeshStandardMaterial({ color: 0x7a7a8a, roughness: 0.95 })
      );
      peak.position.set(i * 12, h/2 + 1, this.player.pos.z - 40 - Math.random() * 20);
      this.scene.add(peak);
      // Snow cap
      const snow = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 2.5, 5),
        new THREE.MeshStandardMaterial({ color: 0xe8eef2, roughness: 0.9 })
      );
      snow.position.set(i * 12, h + 1, peak.position.z);
      this.scene.add(snow);
    }

    // Player — no horse mount
    this.player.pos.set(0, 0, 5);
    this.playerGroup.position.set(0, 0, 5);
    this.playerGroup.position.y = 0;
    this.cam.pos.set(0, 5.5, -1);

    this.buildMtnPassStart();
    this.initRunnerControls();

    // Dust particles
    this.runnerDustParticles = [];
    for (let i = 0; i < 8; i++) {
      const pm = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 5, 4),
        new THREE.MeshStandardMaterial({ color: 0x9a9080, transparent: true, opacity: 0.7 })
      );
      pm.visible = false; pm.life = 0; pm.maxLife = 0.4;
      pm.vel = new THREE.Vector3();
      this.scene.add(pm);
      this.runnerDustParticles.push(pm);
    }

    document.getElementById('hud').style.display = 'none';
    document.getElementById('runner-hud').classList.remove('hidden');
    document.getElementById('jump-btn').style.display = '';
    const isMobile = 'ontouchstart' in window;
    if (isMobile) document.getElementById('runner-btns').classList.remove('hidden');
    document.getElementById('location-name').textContent = 'Taurus Mountains';

    const mEl = document.getElementById('runner-multiplier');
    if (mEl) { mEl.style.display = 'none'; }
    const dpEl = document.getElementById('damascus-progress');
    if (dpEl) dpEl.style.display = '';
    const dpFill = document.getElementById('damascus-progress-fill');
    if (dpFill) dpFill.style.width = '0%';
    const barLabel = document.getElementById('damascus-progress-label');
    if (barLabel) barLabel.textContent = 'Pisidian Antioch';

    this.showQuestPopup(
      'The Taurus Mountains',
      'The road to Pisidian Antioch cuts through dangerous mountain passes. Bandits, boulders, and treacherous terrain.',
      '2 Corinthians 11:26'
    );
  },

  buildMtnPassStart() {
    const roadMat  = new THREE.MeshStandardMaterial({ color: 0x8a7a60, roughness: 0.98 });
    const rockMat  = new THREE.MeshStandardMaterial({ color: 0x7a6a50, roughness: 0.95 });
    const sideMat  = new THREE.MeshStandardMaterial({ color: 0x6a5a48, roughness: 1.0 });

    for (let z = 5; z < 120; z += 8) {
      // Narrow mountain path
      const road = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 8), roadMat);
      road.position.set(0, 0, z);
      road.receiveShadow = true;
      this.scene.add(road);
      this.runnerRoadMeshes.push({ mesh: road, z: z });

      // Rocky sides
      for (const sx of [-5.5, 5.5]) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 8), sideMat);
        side.position.set(sx, 0.75, z);
        this.scene.add(side);
        this.runnerRoadMeshes.push({ mesh: side, z: z });
      }
    }
  },

  updateMtnPass(dt) {
    // Delegate to existing runner update — it handles the same lane system
    this.updateRunner(dt);

    // Override progress bar label
    const pct = Math.min(this.runnerTime / this.runnerTimeLimit, 1.0);
    const dpFill = document.getElementById('damascus-progress-fill');
    if (dpFill) dpFill.style.width = (pct * 100) + '%';
  },

  // ═══════════════════════════════════════
  //  7. PISIDIAN ANTIOCH — SERMON GAME
  // ═══════════════════════════════════════
  loadPisidianAntioch() {
    this.currentScene = 'pisidian';
    this.journeyPhase = 7;
    this.teardownScene();
    this.runnerActive  = false;
    this.mtnPassActive = false;
    this.voyageActive  = false;
    this._runnerMtnMode = false;
    this.sermonScore   = 0;
    this.sermonComplete = false;
    this.pisidiaWeek2  = false;

    this.scene.background = new THREE.Color(0xc8a860);
    this.scene.fog = new THREE.FogExp2(0xd4b870, 0.02);

    this.addSceneLights(0xf0c870, 0xffbb50, 60, 35, 25);
    this.addGround(0xc4a460);

    this.buildPisidianWorld();

    // Player placement
    this.player.pos.set(0, 0, 12);
    this.playerGroup.position.set(0, 0, 12);
    this.playerGroup.rotation.y = Math.PI;
    this.cam.pos.set(0, 9, 24);

    this.showRPGHud();
    document.getElementById('location-name').textContent = 'Pisidian Antioch';
    if (this.elScriptureRef) this.elScriptureRef.textContent = 'Acts 13:14-52';
    if (this.elQuestText) this.elQuestText.textContent = 'Enter the synagogue to preach';

    this.showQuestPopup(
      'Pisidian Antioch — The Synagogue Sermon',
      'On the Sabbath, Paul was invited to speak. His sermon in Acts 13 is one of the most complete records of early Christian preaching.',
      'Acts 13:14-15'
    );
  },

  buildPisidianWorld() {
    const tan = 0xc4a870;

    // City buildings
    const cityBuildings = [
      { x:-12, z:-5, w:7, h:4, d:6 }, { x:12, z:-5, w:7, h:4, d:6 },
      { x:-12, z:10, w:6, h:3.5, d:5 }, { x:12, z:10, w:6, h:3.5, d:5 },
    ];
    for (const b of cityBuildings) {
      this.addBox(b.x, b.h/2, b.z, b.w, b.h, b.d, tan);
      this.addBox(b.x, b.h + 0.12, b.z, b.w+0.2, 0.24, b.d+0.2, 0x9a7848);
    }

    // Synagogue (prominent building)
    this.addBox(0, 3, -8, 14, 6, 10, 0xd8c880);
    this.addBox(0, 6.12, -8, 14.2, 0.24, 10.2, 0xb89848);
    // Synagogue door
    this.addBox(0, 1.5, -2.9, 2.2, 3, 0.2, 0x5a4020);

    // Benches inside
    for (let xi = -4; xi <= 4; xi += 2) {
      this.addBox(xi, 0.3, -6, 1.5, 0.3, 5, 0x7a5a28);
    }

    // Market area
    for (let i = -2; i <= 2; i++) {
      this.addBox(i*3.5, 1.0, 20, 2, 0.1, 1.4, 0x9a7040);
      this.addBox(i*3.5, 2.1, 20, 2.5, 0.12, 1.6, 0xcc8030);
    }

    // City gate (south entrance)
    this.addBox(-4, 3, 28, 1, 6, 1, 0xb09060);
    this.addBox( 4, 3, 28, 1, 6, 1, 0xb09060);
    this.addBox( 0, 6.2, 28, 10, 0.4, 1, 0xb09060);

    // NPCs for the scene
    this.spawnNPC({
      id: 'synagogue_ruler_p', name: 'Synagogue Ruler',
      x: 0, z: -4,
      bodyColor: 0x3a3070, accentColor: 0x7a70a0, headColor: 0xb09060,
      dialogues: [
        { speaker: 'Synagogue Ruler', text: '"Brothers, if you have any word of encouragement for the people, please speak." — Acts 13:15' },
      ],
      onComplete: 'start_sermon',
    });

    this.spawnNPC({
      id: 'jewish_leader_p', name: 'Jewish Leader',
      x: -5, z: -5,
      bodyColor: 0x2a3050, accentColor: 0x5060a0, headColor: 0xb09060,
      dialogues: [
        { speaker: 'Jewish Leader', text: '"The whole city has gathered again! This is too much — we cannot allow this man to continue. He is stirring up the people." — Acts 13:44-45' },
      ],
    });

    this.spawnNPC({
      id: 'gentile_believer', name: 'Gentile Believer',
      x: 5, z: 5,
      bodyColor: 0x5a7060, accentColor: 0x8aa090, headColor: 0xb09060,
      dialogues: [
        { speaker: 'Gentile Believer', text: '"When the Gentiles heard this, they began rejoicing and glorifying the word of the Lord." — Acts 13:48' },
      ],
    });
  },

  startSermonGame() {
    this.sermonScore = 0;
    const rounds = [
      {
        question: 'How do you open your sermon?',
        options: [
          { text: '"God chose our fathers and exalted the people in Egypt."', correct: true, verse: 'Acts 13:17' },
          { text: '"Let me tell you about a man named Jesus."', correct: false },
          { text: '"You must abandon the Law of Moses."', correct: false },
        ],
      },
      {
        question: 'How do you connect the Old Testament to Jesus?',
        options: [
          { text: '"From David\'s offspring, God has brought to Israel a Savior, Jesus, as he promised."', correct: true, verse: 'Acts 13:23' },
          { text: '"The prophecies are complex — you would not understand them."', correct: false },
          { text: '"Forget what you know — start completely fresh."', correct: false },
        ],
      },
      {
        question: 'The leaders in Jerusalem crucified Jesus — what do you say?',
        options: [
          { text: '"Though they found no cause of death in him, they asked Pilate to have him executed. But God raised him from the dead."', correct: true, verse: 'Acts 13:28-30' },
          { text: '"The Romans are to blame, not us."', correct: false },
          { text: '"It was a necessary evil."', correct: false },
        ],
      },
      {
        question: 'How do you close the sermon?',
        options: [
          { text: '"Through this man forgiveness of sins is proclaimed to you — freed from everything you could not be freed from by the law of Moses."', correct: true, verse: 'Acts 13:38-39' },
          { text: '"Join our group and you will be safe."', correct: false },
          { text: '"The law is completely abolished."', correct: false },
        ],
      },
    ];

    let currentRound = 0;
    this.dialogueActive = true;

    const container = document.getElementById('sermon-game');
    const questionEl = document.getElementById('sermon-question');
    const optionsEl  = document.getElementById('sermon-options');
    const scoreEl    = document.getElementById('sermon-score-bar');

    if (!container) {
      // Fallback: just skip to opposition
      this.sermonScore = 4;
      this.showPisidianOpposition();
      return;
    }

    container.classList.remove('hidden');

    const showRound = (idx) => {
      if (idx >= rounds.length) {
        container.classList.add('hidden');
        this.dialogueActive = false;
        this.sermonComplete = true;
        this.showPisidianOpposition();
        return;
      }
      const round = rounds[idx];
      questionEl.textContent = round.question;
      optionsEl.innerHTML = '';
      scoreEl.textContent  = 'Score: ' + this.sermonScore + '/4';

      const shuffled = [...round.options].sort(() => Math.random() - 0.5);
      for (const opt of shuffled) {
        const btn = document.createElement('button');
        btn.className = 'sermon-option';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          if (opt.correct) {
            this.sermonScore++;
            btn.classList.add('sermon-correct');
            const fb = document.createElement('div');
            fb.className = 'sermon-feedback sermon-right';
            fb.textContent = 'Correct! ' + (opt.verse || '');
            optionsEl.appendChild(fb);
          } else {
            btn.classList.add('sermon-wrong');
            const fb = document.createElement('div');
            fb.className = 'sermon-feedback sermon-missed';
            fb.textContent = 'Not the strongest argument. The crowd murmurs.';
            optionsEl.appendChild(fb);
          }
          // Disable all buttons
          for (const b of optionsEl.querySelectorAll('.sermon-option')) b.disabled = true;
          setTimeout(() => { showRound(idx + 1); }, 1600);
        });
        optionsEl.appendChild(btn);
      }
    };

    showRound(0);
  },

  showPisidianOpposition() {
    const score = this.sermonScore;
    let resultText;
    if (score >= 4) resultText = '"The whole city came together to hear the word of the Lord." — Acts 13:44';
    else if (score >= 3) resultText = 'Many believed. A church was planted in Pisidian Antioch.';
    else resultText = 'Some believed, though with questions. The message had been heard.';

    this.showQuestPopup(
      'Sabbath Complete — Week 2 Approaches',
      resultText + '\n\nBut the Jewish leaders were filled with jealousy...',
      'Acts 13:44-45'
    );

    const dismissBtn = document.getElementById('qp-dismiss');
    if (dismissBtn) {
      dismissBtn.onclick = () => {
        document.getElementById('quest-popup').classList.add('hidden');
        this.dialogueActive = false;
        this.pisidiaWeek2 = true;

        // Week 2: Opposition dialogue triggers, then Paul turns to Gentiles
        setTimeout(() => {
          this.startDialogue({
            group: this.npcObjects['jewish_leader_p'] ? this.npcObjects['jewish_leader_p'].group : this.playerGroup,
            data: {
              id: 'pisidian_opposition',
              name: 'Jewish Leader',
              dialogues: [
                { speaker: 'Jewish Leader', text: '"Enough! Who are you to tell us the Messiah has come? You blaspheme! — Acts 13:45' },
                { speaker: 'Paul', text: '"It was necessary that the word of God be spoken to you first. Since you thrust it aside and judge yourselves unworthy of eternal life, behold, we are turning to the Gentiles." — Acts 13:46' },
                { speaker: 'Paul', text: '"For so the Lord has commanded us: \'I have made you a light for the Gentiles, that you may bring salvation to the ends of the earth.\'" — Acts 13:47' },
              ],
              onComplete: 'pisidian_expelled',
            },
          });
        }, 800);
      };
    }
  },

  // ═══════════════════════════════════════
  //  8. ICONIUM
  // ═══════════════════════════════════════
  loadIconium() {
    this.currentScene = 'iconium';
    this.journeyPhase = 8;
    this.teardownScene();

    this.scene.background = new THREE.Color(0xb0c8a0);
    this.scene.fog = new THREE.FogExp2(0xc0d8a8, 0.022);

    this.addSceneLights(0xc0e0a0, 0xffd880, 40, 30, 20);
    this.addGround(0xb0a060);

    // Simple Phrygian city
    const bldgs = [
      {x:-10,z:-5,w:7,h:4,d:6},{x:10,z:-5,w:7,h:4,d:6},
      {x:-10,z:10,w:6,h:3,d:5},{x:10,z:10,w:6,h:3,d:5},
      {x:0,z:-10,w:8,h:5,d:6},
    ];
    for (const b of bldgs) {
      this.addBox(b.x, b.h/2, b.z, b.w, b.h, b.d, 0xc4a870);
      this.addBox(b.x, b.h+0.12, b.z, b.w+0.2, 0.24, b.d+0.2, 0x9a7848);
    }
    // Synagogue
    this.addBox(0, 2.5, -7, 10, 5, 8, 0xd0c080);
    this.addBox(0, 5.12, -7, 10.2, 0.24, 8.2, 0xb09848);
    this.addBox(0, 1.3, -2.9, 1.8, 2.6, 0.2, 0x5a4020);

    this.spawnNPC({
      id: 'iconium_believer', name: 'Jewish Believer',
      x: 3, z: 3,
      bodyColor: 0x4a6a4a, accentColor: 0x8aaa70, headColor: 0xb09060,
      dialogues: [
        { speaker: 'Jewish Believer', text: '"Great signs and wonders have been done here. Many believe — both Jews and Greeks." — Acts 14:1' },
        { speaker: 'Jewish Believer', text: '"But there is a plot forming among those who rejected the message. They plan to stone you and Barnabas." — Acts 14:5' },
      ],
    });

    this.spawnNPC({
      id: 'iconium_hostile', name: 'Hostile Leader',
      x: -5, z: 2,
      bodyColor: 0x3a2040, accentColor: 0x6a4080, headColor: 0xb09060,
      dialogues: [
        { speaker: 'Hostile Leader', text: '"Enough! The people are being divided by this man\'s teaching. The leaders of this city will not tolerate it." — Acts 14:2' },
      ],
    });

    this.player.pos.set(0, 0, 12);
    this.playerGroup.position.set(0, 0, 12);
    this.playerGroup.rotation.y = Math.PI;
    this.cam.pos.set(0, 9, 24);

    this.showRPGHud();
    document.getElementById('location-name').textContent = 'Iconium';
    if (this.elScriptureRef) this.elScriptureRef.textContent = 'Acts 14:1-7';
    if (this.elQuestText) this.elQuestText.textContent = 'Speak to the believers — then decide';

    this.showQuestPopup(
      'Iconium',
      'A great many people believe. But opposition is forming. Stay longer, or flee to Lystra?',
      'Acts 14:1-7'
    );
  },

  // ═══════════════════════════════════════
  //  9. LYSTRA
  // ═══════════════════════════════════════
  loadLystra() {
    this.currentScene = 'lystra';
    this.journeyPhase = 9;
    this.teardownScene();
    this.lystraPhase = 0;
    this.stoneCount  = 0;

    this.scene.background = new THREE.Color(0xa0c090);
    this.scene.fog = new THREE.FogExp2(0xb8d0a0, 0.02);

    this.addSceneLights(0xb0e0a0, 0xffdd80, 40, 30, 20);
    this.addGround(0xb4a460);

    this.buildLystraWorld();

    this.spawnNPC({
      id: 'lame_man', name: 'Lame Man',
      x: 3, z: 8,
      bodyColor: 0x8a7050, accentColor: 0xb09070, headColor: 0xb09060,
      dialogues: [
        { speaker: 'Lame Man', text: '"I have not walked since I was born. I sit here every day and listen to the teachers." — Acts 14:8' },
        { speaker: 'Lame Man', text: '"There is something about you, teacher. I believe what you say about this Jesus."' },
      ],
      onComplete: 'heal_lame_man',
    });

    this.spawnNPC({
      id: 'lystra_citizen', name: 'Citizen of Lystra',
      x: -5, z: 6,
      bodyColor: 0x6a7a50, accentColor: 0x9aaa80, headColor: 0xb09060,
      dialogues: [
        { speaker: 'Citizen of Lystra', text: '"We have never seen anything like this before. The gods themselves have come down to us in human form!" — Acts 14:11' },
      ],
    });

    this.spawnNPC({
      id: 'zeus_priest', name: 'Priest of Zeus',
      x: 0, z: -6,
      bodyColor: 0xd0a050, accentColor: 0xf0c870, headColor: 0xc0a070,
      dialogues: [
        { speaker: 'Priest of Zeus', text: '"The gods have come down to us in the likeness of men! Prepare the oxen! Bring the garlands!" — Acts 14:11-13' },
      ],
      onComplete: 'zeus_scene',
    });

    this.spawnNPC({
      id: 'antioch_agitator', name: 'Agitator from Antioch',
      x: -3, z: -10,
      bodyColor: 0x2a2a3a, accentColor: 0x4a4a6a, headColor: 0x8a7050,
      dialogues: [
        { speaker: 'Agitator', text: '"People of Lystra! This man is a deceiver. He was thrown out of Antioch and Iconium for sowing confusion. Do not believe him!" — Acts 14:19' },
      ],
    });

    this.player.pos.set(0, 0, 14);
    this.playerGroup.position.set(0, 0, 14);
    this.playerGroup.rotation.y = Math.PI;
    this.cam.pos.set(0, 9, 26);

    this.showRPGHud();
    document.getElementById('location-name').textContent = 'Lystra';
    if (this.elScriptureRef) this.elScriptureRef.textContent = 'Acts 14:8-20';
    if (this.elQuestText) this.elQuestText.textContent = 'Speak to the lame man';

    this.showQuestPopup(
      'Lystra — Three Dramatic Moments',
      'A lame man. A crowd that thinks you are gods. And a stoning.',
      'Acts 14:8-20'
    );
  },

  buildLystraWorld() {
    const bldgs = [
      {x:-10,z:-5,w:7,h:4,d:6},{x:10,z:-5,w:7,h:4,d:6},
      {x:-10,z:8,w:6,h:3,d:5},{x:10,z:8,w:6,h:3,d:5},
    ];
    for (const b of bldgs) {
      this.addBox(b.x, b.h/2, b.z, b.w, b.h, b.d, 0xc0a870);
      this.addBox(b.x, b.h+0.12, b.z, b.w+0.2, 0.24, b.d+0.2, 0x9a7848);
    }
    // Zeus temple
    this.addBox(0, 2.5, -12, 12, 5, 9, 0xe0d8c0);
    this.addBox(0, 5.12, -12, 12.2, 0.24, 9.2, 0xc0b890);
    // Temple columns
    for (const cx of [-5, -2.5, 0, 2.5, 5]) {
      this.addBox(cx, 2.0, -7.5, 0.6, 4, 0.6, 0xe8e0d0);
    }
    // City road
    this.addBox(0, 0.04, 3, 6, 0.08, 20, 0xb0a060);
    // Palm trees
    for (const [px, pz] of [[-7,2],[7,2],[-7,18],[7,18]]) this.addPalm(px, pz);
    // Oxen representation (2 brown boxes with legs)
    for (const ox of [-2, 2]) {
      this.addBox(ox, 0.5, -4.5, 1.2, 1, 2, 0x7a4a18);
    }
  },

  showZeusScene() {
    this.lystraPhase = 1;
    this.dialogueActive = true;

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.88);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Cinzel,serif;text-align:center;padding:40px;';
    document.body.appendChild(ov);

    const mk = (html, css) => {
      const d = document.createElement('div');
      d.innerHTML = html;
      d.style.cssText = css + 'opacity:0;transition:opacity 1.1s ease;';
      ov.appendChild(d);
      return d;
    };

    const t1 = mk('"When the crowds saw what Paul had done, they lifted up their voices, saying in Lycaonian, \'The gods have come down to us in the likeness of men!\'"',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#f0d090;font-size:clamp(0.95rem,2.5vw,1.1rem);max-width:540px;line-height:1.9;margin-bottom:10px;');
    const t2 = mk('<em>Barnabas they called Zeus, and Paul, Hermes.</em> — Acts 14:11-12',
      'font-family:Crimson Text,Georgia,serif;color:#e0c080;font-size:clamp(0.9rem,2.3vw,1.05rem);margin-bottom:20px;');
    const t3 = mk('"Paul and Barnabas tore their garments and rushed out..."',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#c8b880;font-size:clamp(0.85rem,2.2vw,1rem);max-width:500px;line-height:1.8;margin-bottom:16px;');
    const t4 = mk('"We also are men, of like nature with you, and we bring you good news, that you should turn from these vain things to a living God, who made the heaven and the earth and the sea and all that is in them." — Acts 14:15',
      'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#a8c8e0;font-size:clamp(0.85rem,2.2vw,1rem);max-width:540px;line-height:1.9;margin-bottom:20px;');

    setTimeout(() => { t1.style.opacity = '1'; }, 400);
    setTimeout(() => { t2.style.opacity = '1'; }, 1600);
    setTimeout(() => { t3.style.opacity = '1'; }, 2800);
    setTimeout(() => { t4.style.opacity = '1'; }, 4000);

    setTimeout(() => {
      ov.style.transition = 'opacity 1.5s';
      ov.style.opacity = '0';
      setTimeout(() => {
        if (ov.parentNode) ov.remove();
        this.dialogueActive = false;
        this.showStoningScene();
      }, 1600);
    }, 6000);
  },

  showStoningScene() {
    this.lystraPhase = 2;
    this.showNotification('Jews from Antioch and Iconium\narrived and turned the crowd.\nRun!');

    setTimeout(() => {
      // Simple stoning cutscene — no need for a full runner
      this.dialogueActive = true;
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Cinzel,serif;text-align:center;padding:40px;';
      document.body.appendChild(ov);

      const mk = (html, css) => {
        const d = document.createElement('div');
        d.innerHTML = html;
        d.style.cssText = css + 'opacity:0;transition:opacity 1.1s ease;';
        ov.appendChild(d);
        return d;
      };

      const t1 = mk('"But Jews came from Antioch and Iconium, and having persuaded the crowds, they stoned Paul and dragged him out of the city, supposing that he was dead."',
        'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#f0d090;font-size:clamp(0.9rem,2.3vw,1.1rem);max-width:540px;line-height:1.9;margin-bottom:16px;');
      const t2 = mk('— Acts 14:19',
        'color:#9a8050;font-size:0.85rem;margin-bottom:24px;');
      const t3 = mk('"But when the disciples gathered about him, he rose up and entered the city..."',
        'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#c8e0c8;font-size:clamp(0.9rem,2.3vw,1.05rem);max-width:500px;line-height:1.8;margin-bottom:10px;');
      const t4 = mk('— Acts 14:20',
        'color:#80a080;font-size:0.85rem;margin-bottom:24px;');
      const t5 = mk('"Through many tribulations we must enter the kingdom of God."',
        'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#d0c090;font-size:clamp(0.9rem,2.4vw,1.1rem);max-width:500px;line-height:1.9;margin-bottom:8px;');
      const t6 = mk('— Acts 14:22',
        'color:#9a8050;font-size:0.85rem;');

      setTimeout(() => { t1.style.opacity = '1'; }, 400);
      setTimeout(() => { t2.style.opacity = '1'; }, 1600);
      // Black flash for stoning
      const blackout = document.createElement('div');
      blackout.style.cssText = 'position:fixed;inset:0;z-index:210;background:black;opacity:0;pointer-events:none;transition:opacity 0.4s;';
      document.body.appendChild(blackout);
      setTimeout(() => {
        blackout.style.opacity = '1';
        setTimeout(() => { blackout.style.opacity = '0'; setTimeout(() => blackout.remove(), 600); }, 800);
      }, 2000);
      setTimeout(() => { t3.style.opacity = '1'; }, 3200);
      setTimeout(() => { t4.style.opacity = '1'; }, 4200);
      setTimeout(() => { t5.style.opacity = '1'; }, 5200);
      setTimeout(() => { t6.style.opacity = '1'; }, 6000);

      setTimeout(() => {
        ov.style.transition = 'opacity 1.5s';
        ov.style.opacity = '0';
        setTimeout(() => {
          if (ov.parentNode) ov.remove();
          this.dialogueActive = false;
          this.showQuestPopup(
            'Lystra — Paul rises',
            'From Lystra, Paul traveled to Derbe. He got up and entered the city.',
            'Acts 14:20'
          );
          const dismissBtn = document.getElementById('qp-dismiss');
          if (dismissBtn) {
            const orig = dismissBtn.onclick;
            dismissBtn.onclick = () => {
              if (orig) orig();
              this.loadDerbe();
            };
          }
        }, 1600);
      }, 7500);
    }, 2500);
  },

  // ═══════════════════════════════════════
  //  10. DERBE
  // ═══════════════════════════════════════
  loadDerbe() {
    this.currentScene = 'derbe';
    this.journeyPhase = 10;
    this.teardownScene();

    this.scene.background = new THREE.Color(0xb0a080);
    this.scene.fog = new THREE.FogExp2(0xc0b890, 0.022);

    this.addSceneLights(0xd0c090, 0xffcc70, 40, 30, 20);
    this.addGround(0xc0a870);

    // Eastern Anatolian buildings — drier, dusty
    const derbeBldgs = [
      {x:-9,z:-4,w:6,h:3.5,d:5},{x:9,z:-4,w:6,h:3.5,d:5},
      {x:-9,z:8,w:5,h:3,d:5},{x:9,z:8,w:5,h:3,d:5},
      {x:0,z:-8,w:7,h:4,d:5},
    ];
    for (const b of derbeBldgs) {
      this.addBox(b.x, b.h/2, b.z, b.w, b.h, b.d, 0xc8a870);
    }

    // Gaius NPC
    this.spawnNPC({
      id: 'gaius_derbe', name: 'Gaius',
      x: 3, z: 5,
      bodyColor: 0x5a6a4a, accentColor: 0x8a9a70, headColor: 0xb09060,
      dialogues: [
        { speaker: 'Gaius', text: '"I heard your message today. I believe. Whatever you do next, I want to follow you." — Acts 20:4 (Gaius of Derbe)' },
        { speaker: 'Gaius', text: '"You have come far. Tarsus is not distant from here — you could be home before the month is out. Or... you could go back."' },
      ],
      onComplete: 'gaius_recruited',
    });

    this.spawnNPC({
      id: 'derbe_elder', name: 'New Believer',
      x: -4, z: 4,
      bodyColor: 0x7a6a50, accentColor: 0xaa9070, headColor: 0xb09060,
      dialogues: [
        { speaker: 'New Believer', text: '"Many disciples were made in Derbe today. Paul\'s work here has been good." — Acts 14:20-21' },
      ],
    });

    this.player.pos.set(0, 0, 12);
    this.playerGroup.position.set(0, 0, 12);
    this.playerGroup.rotation.y = Math.PI;
    this.cam.pos.set(0, 9, 24);

    this.showRPGHud();
    document.getElementById('location-name').textContent = 'Derbe';
    if (this.elScriptureRef) this.elScriptureRef.textContent = 'Acts 14:20-21';
    if (this.elQuestText) this.elQuestText.textContent = 'Speak to Gaius';

    this.showQuestPopup(
      'Derbe — The Turning Point',
      'Many disciples were made in Derbe. Paul could have gone home to Tarsus — but he chose to go back through every dangerous city.',
      'Acts 14:20-21'
    );
  },

  // ═══════════════════════════════════════
  //  11. RETURN JOURNEY
  // ═══════════════════════════════════════
  loadReturnJourney() {
    this.currentScene = 'return';
    this.journeyPhase = 11;

    // Show a map montage overlay
    this.dialogueActive = true;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.94);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Cinzel,serif;text-align:center;padding:40px;overflow-y:auto;';
    document.body.appendChild(ov);

    const title = document.createElement('div');
    title.textContent = 'The Return Journey';
    title.style.cssText = 'color:#c9a84c;font-size:clamp(1.6rem,4vw,2.2rem);font-weight:700;letter-spacing:0.12em;margin-bottom:6px;opacity:0;transition:opacity 1s ease;';
    ov.appendChild(title);

    const sub = document.createElement('div');
    sub.textContent = 'Strengthening the disciples through every city — Acts 14:21-26';
    sub.style.cssText = 'color:#7a6030;font-size:clamp(0.75rem,1.8vw,0.9rem);letter-spacing:0.15em;margin-bottom:32px;opacity:0;transition:opacity 1s ease 0.4s;';
    ov.appendChild(sub);

    const stops = [
      { city: 'Lystra', verse: '"They appointed elders and committed them to the Lord with prayer and fasting." — Acts 14:23' },
      { city: 'Iconium', verse: '"Strengthening the souls of the disciples, encouraging them to continue in the faith." — Acts 14:22' },
      { city: 'Pisidian Antioch', verse: '"Through many tribulations we must enter the kingdom of God." — Acts 14:22' },
      { city: 'Perga', verse: '"They preached in Perga as well." — Acts 14:25' },
      { city: 'Attalia', verse: '"They sailed back to Antioch." — Acts 14:26' },
    ];

    const stopsContainer = document.createElement('div');
    stopsContainer.style.cssText = 'display:flex;flex-direction:column;gap:14px;max-width:540px;width:100%;';
    ov.appendChild(stopsContainer);

    stops.forEach((stop, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'opacity:0;transition:opacity 0.8s ease;text-align:left;border-left:3px solid #c9a84c;padding:10px 16px;background:rgba(201,168,76,0.06);border-radius:0 6px 6px 0;';
      row.innerHTML = '<div style="color:#c9a84c;font-size:0.9rem;letter-spacing:0.1em;margin-bottom:4px;">' + stop.city + '</div>'
        + '<div style="font-family:Crimson Text,Georgia,serif;font-style:italic;color:#c8b880;font-size:0.9rem;line-height:1.7;">' + stop.verse + '</div>';
      stopsContainer.appendChild(row);
      setTimeout(() => { row.style.opacity = '1'; }, 800 + i * 700);
    });

    const finalVerse = document.createElement('div');
    finalVerse.style.cssText = 'margin-top:28px;font-family:Crimson Text,Georgia,serif;font-style:italic;color:#a8c8e0;font-size:clamp(0.9rem,2.3vw,1.05rem);max-width:500px;line-height:1.9;opacity:0;transition:opacity 1.2s ease;';
    finalVerse.innerHTML = '"They gathered the church together and declared all that God had done with them, and how he had opened a door of faith to the Gentiles." — Acts 14:27';
    ov.appendChild(finalVerse);

    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Return to Antioch';
    continueBtn.style.cssText = 'margin-top:28px;padding:12px 32px;background:rgba(201,168,76,0.15);border:2px solid #c9a84c;color:#c9a84c;font-family:Cinzel,serif;font-size:1rem;letter-spacing:0.1em;cursor:pointer;border-radius:8px;opacity:0;transition:opacity 1s ease;';
    ov.appendChild(continueBtn);

    setTimeout(() => { title.style.opacity = '1'; }, 200);
    setTimeout(() => { sub.style.opacity = '1'; }, 600);
    setTimeout(() => { finalVerse.style.opacity = '1'; }, 800 + stops.length * 700 + 400);
    setTimeout(() => { continueBtn.style.opacity = '1'; }, 800 + stops.length * 700 + 1400);

    continueBtn.addEventListener('click', () => {
      ov.style.transition = 'opacity 1s';
      ov.style.opacity = '0';
      setTimeout(() => {
        if (ov.parentNode) ov.remove();
        this.dialogueActive = false;
        this.showJourney1Complete();
      }, 1000);
    });
    continueBtn.addEventListener('touchstart', (e) => { e.preventDefault(); continueBtn.click(); }, { passive: false });
  },

  // ═══════════════════════════════════════
  //  JOURNEY 1 COMPLETE SCREEN
  // ═══════════════════════════════════════
  showJourney1Complete() {
    this.j1Complete = true;
    this.inventory.shekels += 500;
    this.updateInventoryHUD();

    this.dialogueActive = true;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.96);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Cinzel,serif;text-align:center;padding:40px;overflow-y:auto;';
    document.body.appendChild(ov);

    const t1 = document.createElement('div');
    t1.textContent = 'First Missionary Journey';
    t1.style.cssText = 'color:#c9a84c;font-size:clamp(1.8rem,5vw,2.8rem);font-weight:700;letter-spacing:0.15em;text-shadow:0 0 30px rgba(201,168,76,0.5);margin-bottom:4px;opacity:0;transition:opacity 1s;';
    ov.appendChild(t1);

    const t2 = document.createElement('div');
    t2.textContent = 'COMPLETE — Acts 13-14';
    t2.style.cssText = 'color:#9a8050;font-size:clamp(0.8rem,2vw,1rem);letter-spacing:0.25em;margin-bottom:30px;opacity:0;transition:opacity 1s 0.4s;';
    ov.appendChild(t2);

    const cities = ['Antioch of Syria','Cyprus (Salamis & Paphos)','Perga','Pisidian Antioch','Iconium','Lystra','Derbe'];
    const citiesBox = document.createElement('div');
    citiesBox.style.cssText = 'background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:20px 28px;max-width:460px;margin-bottom:20px;text-align:left;opacity:0;transition:opacity 1s 0.8s;';
    citiesBox.innerHTML = '<div style="color:#c9a84c;font-size:0.82rem;letter-spacing:0.2em;margin-bottom:10px;">CITIES VISITED</div>'
      + cities.map(c => '<div style="font-family:Crimson Text,Georgia,serif;color:#c8b880;font-size:0.95rem;padding:3px 0;">&#10022; ' + c + '</div>').join('');
    ov.appendChild(citiesBox);

    const rewards = document.createElement('div');
    rewards.style.cssText = 'background:rgba(120,200,120,0.06);border:1px solid rgba(120,200,120,0.3);border-radius:10px;padding:16px 24px;max-width:460px;margin-bottom:24px;opacity:0;transition:opacity 1s 1.2s;font-family:Crimson Text,Georgia,serif;color:#a0e0a0;font-size:0.95rem;';
    rewards.innerHTML = '<strong>Rewards:</strong> +500 shekels &nbsp;&nbsp; +Gaius as companion';
    ov.appendChild(rewards);

    const comingSoon = document.createElement('div');
    comingSoon.style.cssText = 'color:#7a6030;font-size:clamp(0.8rem,2vw,0.95rem);letter-spacing:0.18em;opacity:0;transition:opacity 1s 1.6s;margin-bottom:20px;';
    comingSoon.textContent = 'Journey 2: The Jerusalem Council — Coming Soon';
    ov.appendChild(comingSoon);

    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Return to Jerusalem';
    restartBtn.style.cssText = 'padding:12px 28px;background:rgba(201,168,76,0.15);border:2px solid #c9a84c;color:#c9a84c;font-family:Cinzel,serif;font-size:0.95rem;letter-spacing:0.1em;cursor:pointer;border-radius:8px;opacity:0;transition:opacity 1s 2s;';
    ov.appendChild(restartBtn);

    setTimeout(() => { t1.style.opacity = '1'; }, 300);
    setTimeout(() => { t2.style.opacity = '1'; }, 700);
    setTimeout(() => { citiesBox.style.opacity = '1'; }, 1200);
    setTimeout(() => { rewards.style.opacity = '1'; }, 1700);
    setTimeout(() => { comingSoon.style.opacity = '1'; }, 2100);
    setTimeout(() => { restartBtn.style.opacity = '1'; }, 2500);

    restartBtn.addEventListener('click', () => {
      ov.style.transition = 'opacity 1s';
      ov.style.opacity = '0';
      setTimeout(() => {
        if (ov.parentNode) ov.remove();
        this.dialogueActive = false;
        this.loadJerusalemCouncil();
      }, 1000);
    });
    restartBtn.addEventListener('touchstart', (e) => { e.preventDefault(); restartBtn.click(); }, { passive: false });
  },

  // ═══════════════════════════════════════
  //  JERUSALEM COUNCIL STUB
  // ═══════════════════════════════════════
  loadJerusalemCouncil() {
    this.dialogueActive = true;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:#080500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Cinzel,serif;text-align:center;padding:40px;';
    document.body.appendChild(ov);

    const t1 = document.createElement('div');
    t1.textContent = "Paul\u2019s Journeys";
    t1.style.cssText = 'color:#c9a84c;font-size:clamp(2rem,6vw,3rem);font-weight:700;letter-spacing:0.15em;margin-bottom:10px;';
    ov.appendChild(t1);

    const t2 = document.createElement('div');
    t2.textContent = 'Second Journey — The Jerusalem Council';
    t2.style.cssText = 'color:#9a8050;font-size:clamp(0.85rem,2.2vw,1.1rem);letter-spacing:0.18em;margin-bottom:30px;';
    ov.appendChild(t2);

    const soon = document.createElement('div');
    soon.style.cssText = 'font-family:Crimson Text,Georgia,serif;font-style:italic;color:#c8b880;font-size:clamp(1rem,2.5vw,1.2rem);max-width:440px;line-height:1.9;margin-bottom:30px;';
    soon.innerHTML = '"It seemed good to the Holy Spirit and to us to lay on you no greater burden than these requirements..." — Acts 15:28<br><br><em>Coming Soon</em>';
    ov.appendChild(soon);

    const backBtn = document.createElement('button');
    backBtn.textContent = 'Play Again from Jerusalem';
    backBtn.style.cssText = 'padding:12px 28px;background:rgba(201,168,76,0.15);border:2px solid #c9a84c;color:#c9a84c;font-family:Cinzel,serif;font-size:0.9rem;letter-spacing:0.1em;cursor:pointer;border-radius:8px;margin-top:8px;';
    ov.appendChild(backBtn);

    backBtn.addEventListener('click', () => {
      location.reload();
    });
    backBtn.addEventListener('touchstart', (e) => { e.preventDefault(); location.reload(); }, { passive: false });
  },

  // ═══════════════════════════════════════
  //  ENDIALOG CALLBACKS FOR JOURNEY 1
  // ═══════════════════════════════════════
  _handleJ1DialogueComplete(cb, nid) {
    if (cb === 'antioch_leader') {
      if (!this.antiochNPCsMet[nid]) {
        this.antiochNPCsMet[nid] = true;
        const leaderIds = ['barnabas_antioch','simeon_niger','lucius_cyrene','manaen','john_mark'];
        if (leaderIds.includes(nid)) {
          this.antiochLeadersMet++;
          this.showNotification('Church leader met: ' + this.antiochLeadersMet + '/5');
          if (this.antiochLeadersMet >= 5) {
            this.antiochAllMet = true;
            if (this.elQuestText) this.elQuestText.textContent = 'Enter the church to receive commissioning';
            this.showNotification('All leaders met!\nEnter the church building.');
          }
        }
      }

    } else if (cb === 'salamis_done') {
      this.salamisSynagogueVisited = true;
      this.showNotification('The message was heard in Salamis.\nNow travel west to Paphos...');
      setTimeout(() => { this.loadPaphos(); }, 3000);

    } else if (cb === 'meet_proconsul') {
      if (this.elymosBlinded) return;
      // After meeting proconsul, offer Elymas choice
      this.showChoice(
        'Bar-Jesus opposes the gospel. What do you do?',
        'Confront him boldly',
        'Speak only to the proconsul',
        () => { this.showElymasJudgment(); },
        () => {
          this.showNotification('You continue speaking to the proconsul.\nElymas keeps interrupting...');
          setTimeout(() => { this.showElymasJudgment(); }, 2000);
        }
      );

    } else if (cb === 'challenge_elymas') {
      this.showElymasJudgment();

    } else if (cb === 'john_mark_departs') {
      this.showChoice(
        'John Mark is going home to Jerusalem.',
        '"We release you, John Mark. God go with you."',
        '"This is desertion, Mark. I will remember this."',
        () => {
          this.showNotification('John Mark returns to Jerusalem.\nPaul presses on into the mountains.');
          // Remove John Mark from scene
          if (this.npcObjects['john_mark_perga']) {
            this.scene.remove(this.npcObjects['john_mark_perga'].group);
            delete this.npcObjects['john_mark_perga'];
          }
          setTimeout(() => {
            this.showQuestPopup(
              'The Road Ahead — Taurus Mountains',
              'Bandits, altitude, and hard terrain. But Paul presses on.',
              '2 Corinthians 11:26'
            );
            const dismissBtn = document.getElementById('qp-dismiss');
            if (dismissBtn) {
              dismissBtn.onclick = () => {
                document.getElementById('quest-popup').classList.add('hidden');
                this.dialogueActive = false;
                this.loadMountainPass();
              };
            }
          }, 1000);
        },
        () => {
          this.showNotification('John Mark returns to Jerusalem.\n(This disagreement will matter later.)');
          if (this.npcObjects['john_mark_perga']) {
            this.scene.remove(this.npcObjects['john_mark_perga'].group);
            delete this.npcObjects['john_mark_perga'];
          }
          setTimeout(() => {
            this.showQuestPopup(
              'The Road Ahead — Taurus Mountains',
              'Bandits, altitude, and hard terrain. But Paul presses on.',
              '2 Corinthians 11:26'
            );
            const dismissBtn = document.getElementById('qp-dismiss');
            if (dismissBtn) {
              dismissBtn.onclick = () => {
                document.getElementById('quest-popup').classList.add('hidden');
                this.dialogueActive = false;
                this.loadMountainPass();
              };
            }
          }, 1000);
        }
      );

    } else if (cb === 'start_sermon') {
      this.startSermonGame();

    } else if (cb === 'pisidian_expelled') {
      this.showNotification('Paul and Barnabas shook the dust\nfrom their feet and went to Iconium.\n— Acts 13:51');
      setTimeout(() => {
        this.showQuestPopup(
          'A Church Left Behind',
          'The disciples were filled with joy and with the Holy Spirit.',
          'Acts 13:52'
        );
        const dismissBtn = document.getElementById('qp-dismiss');
        if (dismissBtn) {
          dismissBtn.onclick = () => {
            document.getElementById('quest-popup').classList.add('hidden');
            this.dialogueActive = false;
            this.loadIconium();
          };
        }
      }, 1500);

    } else if (cb === 'heal_lame_man') {
      // Show healing — lame man rises
      this.showChoice(
        '"Paul looked intently at him and saw that he had faith to be made well." — Acts 14:9',
        '"Stand upright on your feet!"',
        'Wait and observe',
        () => {
          // Animate the NPC rising
          const npcObj = this.npcObjects['lame_man'];
          if (npcObj) {
            let t = 0;
            const anim = setInterval(() => {
              t += 0.05;
              npcObj.group.position.y = Math.min(t, 1) * 0.0;
              if (t >= 1) { clearInterval(anim); }
            }, 30);
          }
          this.showNotification('"And he sprang up and began walking."\n— Acts 14:10');
          setTimeout(() => {
            this.showQuestPopup(
              'A Man Walks',
              '"The man who had never walked... sprang up and began walking." Now speak to the priest of Zeus.',
              'Acts 14:10'
            );
            const dismissBtn = document.getElementById('qp-dismiss');
            if (dismissBtn) {
              dismissBtn.onclick = () => {
                document.getElementById('quest-popup').classList.add('hidden');
                this.dialogueActive = false;
              };
            }
          }, 1500);
        },
        () => {
          this.showNotification('Paul looked intently at the man...\nApproach him again when ready.');
        }
      );

    } else if (cb === 'zeus_scene') {
      this.showZeusScene();

    } else if (cb === 'gaius_recruited') {
      this.showNotification('Gaius of Derbe joined the company!\n(Acts 20:4)');
      this.showChoice(
        '"Many disciples were made in Derbe. The way home to Tarsus is near — or return through the dangerous cities to strengthen the churches."',
        'Return through Lystra, Iconium, Antioch',
        'Take the road home to Tarsus',
        () => {
          this.showQuestPopup(
            'Paul Retraces His Steps',
            'Through every city that tried to kill him, Paul returned to strengthen what was built.',
            'Acts 14:21-22'
          );
          const dismissBtn = document.getElementById('qp-dismiss');
          if (dismissBtn) {
            dismissBtn.onclick = () => {
              document.getElementById('quest-popup').classList.add('hidden');
              this.dialogueActive = false;
              this.loadReturnJourney();
            };
          }
        },
        () => {
          this.showNotification('"But Paul turned back..."\nThe right path leads through the danger.');
          setTimeout(() => {
            this.showChoice(
              'The disciples need you. Will you return?',
              'Yes — return through the cities',
              'Go home to Tarsus',
              () => { this.loadReturnJourney(); },
              () => {
                this.showNotification('Paul turned back. The churches needed him.');
                setTimeout(() => { this.loadReturnJourney(); }, 2000);
              }
            );
          }, 2000);
        }
      );
    }
  },

};

// ── STARTUP ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  Game.init();
  window._G = Game;
});
