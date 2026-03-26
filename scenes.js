// scenes.js — Jerusalem 3D World Data (Expanded 3×)
// Paul's Journeys — A Biblical RPG

var WORLD = {
  npcs: [

    // ── Main quest NPCs ─────────────────────────────────────
    {
      id: 'high_priest', name: 'Caiaphas, High Priest',
      x: 8, z: -19,
      bodyColor: 0xf5f0e0, accentColor: 0xc9a84c, headColor: 0xc09060,
      isHighPriest: true,
      dialogues: [
        { speaker: 'High Priest', text: '"Saul of Tarsus. Your zeal for the Law is known throughout Jerusalem. I have been expecting you."' },
        { speaker: 'High Priest', text: '"And Saul, yet breathing out threatenings and slaughter against the disciples of the Lord, went unto the high priest." \u2014 Acts 9:1' },
        { speaker: 'High Priest', text: '"These followers of The Way have spread to Damascus. You will go there, and bring them back \u2014 bound \u2014 to face judgment in Jerusalem."' },
        { speaker: 'High Priest', text: '"And desired of him letters to Damascus to the synagogues, that if he found any of this way, whether they were men or women, he might bring them bound unto Jerusalem." \u2014 Acts 9:2' },
        { speaker: 'High Priest', text: '"The letters are sealed with the authority of the Sanhedrin. God speed your mission, Saul." He presses the scrolls into your hands.' },
      ],
      onComplete: 'receive_letters',
    },
    {
      id: 'merchant', name: 'Market Merchant',
      x: -7, z: 4,
      bodyColor: 0x8b6040, accentColor: 0xc07840, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Merchant', text: '"Fresh figs! Dates from Jericho! The finest in all Jerusalem!" He glances toward the temple.' },
        { speaker: 'Merchant', text: '"You seek the High Priest? Follow the road north \u2014 straight through the market. You cannot miss the great white walls of the temple."' },
      ],
      onComplete: null,
    },
    {
      id: 'pharisee', name: 'Pharisee',
      x: 6, z: -3,
      bodyColor: 0x2a4a6a, accentColor: 0x5a8aaa, headColor: 0xc09060,
      dialogues: [
        { speaker: 'Pharisee', text: '"Shalom, brother Saul. The followers of The Way grow bolder each day \u2014 preaching openly that Jesus rose from the dead."' },
        { speaker: 'Pharisee', text: '"Madness! You do God\'s work pursuing them. May the Almighty grant you success on the road to Damascus, brother."' },
      ],
      onComplete: null,
    },

    // ── Stall Workers (upper market) ────────────────────────
    {
      id: 'worker_figs', name: 'Fig Seller', x: -7, z: 1.8,
      bodyColor: 0x7a5a30, accentColor: 0xd4a860, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Fig Seller', text: '"Fresh figs from Jericho! Sweet dates from the Jordan valley!" He eyes you hopefully.' },
        { speaker: 'Fig Seller', text: '"Business is slow. Ever since Saul began rounding up followers of The Way, people hurry home before sunset."' },
      ],
      onComplete: null,
    },
    {
      id: 'worker_cloth', name: 'Cloth Merchant', x: -4, z: 1.8,
      bodyColor: 0x6a3060, accentColor: 0xaa70a0, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Cloth Merchant', text: '"Fine linen from Egypt! Wool from the hills of Judea! Come, feel the quality!"' },
        { speaker: 'Cloth Merchant', text: '"Traveling far? Take a good cloak \u2014 the road to Damascus is no short walk, friend."' },
      ],
      onComplete: null,
    },
    {
      id: 'worker_spice', name: 'Spice Trader', x: 7, z: 1.8,
      bodyColor: 0x804020, accentColor: 0xc07030, headColor: 0xc09060,
      dialogues: [
        { speaker: 'Spice Trader', text: '"Cinnamon, myrrh, frankincense! The finest spices from Arabia and beyond!"' },
        { speaker: 'Spice Trader', text: '"I heard a man named Stephen was stoned not long ago. A terrible business. The city has not been the same."' },
      ],
      onComplete: null,
    },
    {
      id: 'worker_pottery', name: 'Potter', x: 4, z: 5.8,
      bodyColor: 0x8b5a20, accentColor: 0xc08040, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Potter', text: '"I shape the clay as the LORD shapes us. Each vessel has its purpose."' },
        { speaker: 'Potter', text: '"\"But now, O LORD, thou art our father; we are the clay, and thou our potter.\" \u2014 Isaiah 64:8"' },
      ],
      onComplete: null,
    },
    {
      id: 'worker_bread', name: 'Bread Seller', x: 7, z: 5.8,
      bodyColor: 0x9a7040, accentColor: 0xd4a060, headColor: 0xb08050,
      dialogues: [
        { speaker: 'Bread Seller', text: '"Barley loaves! Still warm from the oven! A denarius for two loaves!"' },
        { speaker: 'Bread Seller', text: '"Buy bread before you leave, traveler. The desert road does not feed the hungry."' },
      ],
      onComplete: null,
    },
    {
      id: 'worker_oil', name: 'Oil Merchant', x: -7, z: 5.8,
      bodyColor: 0x4a6030, accentColor: 0x8aaa50, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Oil Merchant', text: '"Olive oil from the Mount of Olives! The purest pressing for lamps and cooking alike!"' },
        { speaker: 'Oil Merchant', text: '"Keep your lamp full, friend. \"Thy word is a lamp unto my feet.\" \u2014 Psalm 119:105"' },
      ],
      onComplete: null,
    },

    // ── Extended market stall workers ───────────────────────
    {
      id: 'worker_weaver', name: 'Weaver', x: 10, z: 18,
      bodyColor: 0x5a4a8a, accentColor: 0x8a7aaa, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Weaver', text: '"I weave cloth from the finest wool of Judea and linen from Egypt. Each thread placed with care."' },
        { speaker: 'Weaver', text: '"If you need quality cloth worked into a tent, seek out Benjamin the craftsman — he works the looms down in the southern quarter near the stables."' },
      ],
      onComplete: null,
    },
    {
      id: 'worker_grain', name: 'Grain Merchant', x: 5, z: 16.8,
      bodyColor: 0x8a7040, accentColor: 0xc0a060, headColor: 0xb08050,
      dialogues: [
        { speaker: 'Grain Merchant', text: '"Barley and wheat from the fields of Judea! Fill your stores before the long journey south!"' },
        { speaker: 'Grain Merchant', text: '"Many travelers pass through here headed for the Damascus road. It is a long three-day walk."' },
      ],
      onComplete: null,
    },
    {
      id: 'worker_herbs', name: 'Herb Seller', x: -8, z: 13.8,
      bodyColor: 0x4a7a50, accentColor: 0x7aba7a, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Herb Seller', text: '"Hyssop, mint, and cumin! Medicinal herbs and spices for any ailment or feast!"' },
        { speaker: 'Herb Seller', text: '"\"He causeth the grass to grow for the cattle, and herb for the service of man.\" \u2014 Psalm 104:14"' },
      ],
      onComplete: null,
    },
    {
      id: 'worker_metal', name: 'Metalworker', x: 8, z: 13.8,
      bodyColor: 0x5a5a6a, accentColor: 0x8a8a9a, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Metalworker', text: '"Bronze tools! Iron blades! The finest craft work in Jerusalem, forged by my own hand."' },
        { speaker: 'Metalworker', text: '"\"Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.\" \u2014 Proverbs 27:17"' },
      ],
      onComplete: null,
    },

    // ── Talking Pair ────────────────────────────────────────
    {
      id: 'talker_a', name: 'Townsman',
      x: 2, z: 13, staticFacing: Math.PI / 2,
      bodyColor: 0x5a6a8a, accentColor: 0x8aaaca, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Townsman', text: '"I tell you, these followers of The Way are good people. They sell their possessions and share everything with the poor!"' },
        { speaker: 'Townsman', text: '"\"And all that believed were together, and had all things common.\" \u2014 Acts 2:44. How can that be heresy?"' },
      ],
      onComplete: null,
    },
    {
      id: 'talker_b', name: 'Scribe',
      x: 4.5, z: 13, staticFacing: -Math.PI / 2,
      bodyColor: 0x2a4a2a, accentColor: 0x4a8a4a, headColor: 0xc09060,
      dialogues: [
        { speaker: 'Scribe', text: '"They blaspheme the Law! They say this Jesus rose from the dead. Saul is right to pursue them. The Sanhedrin must act!"' },
        { speaker: 'Scribe', text: '"Mark my words \u2014 if these followers of The Way are not silenced, they will bring Rome\'s wrath down upon all Jerusalem."' },
      ],
      onComplete: null,
    },

    // ── Gate Guard ──────────────────────────────────────────
    {
      id: 'gate_guard', name: 'Gate Guard',
      x: 0, z: 54,
      bodyColor: 0x3a4a5a, accentColor: 0x7a8a9a, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Gate Guard', text: '"Halt. No one passes to the Damascus road without letters of passage bearing the seal of the Sanhedrin."' },
        { speaker: 'Gate Guard', text: '"Return to the temple and speak with the High Priest. Come back with proper papers."' },
      ],
      dialoguesMissing: [
        { speaker: 'Gate Guard', text: '"Your papers are in order, but you cannot make this journey alone. The Damascus road is three days through the wilderness."' },
        { speaker: 'Gate Guard', text: '"You will need companions to ride with you, and horses for the journey. Come back when your company is assembled."' },
      ],
      dialoguesAlt: [
        { speaker: 'Gate Guard', text: '"Present your letters, traveler." He takes the scroll and examines the wax seal carefully.' },
        { speaker: 'Gate Guard', text: '"The seal of Caiaphas, High Priest of the Sanhedrin\u2026 and your company is assembled. These are in order." He steps aside.' },
        { speaker: 'Gate Guard', text: '"\"And desired of him letters to Damascus to the synagogues.\"\u00a0\u2014 Acts 9:2. God speed your journey, friend."' },
      ],
      onComplete: 'gate_open',
    },

    // ── Temple Soldiers (become companions after letters) ────
    {
      id: 'barnabas', name: 'Temple Soldier', trueName: 'Barnabas',
      x: -15.5, z: 22,
      bodyColor: 0x5a4a3a, accentColor: 0x8a6a40, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Temple Soldier', text: '"Halt, traveler. You are near the Temple courts. Keep to the road and move along."' },
        { speaker: 'Temple Soldier', text: '"By order of the Sanhedrin, no disturbances in the Temple district. Go about your business."' },
      ],
      dialoguesAlt: [
        { speaker: 'Barnabas', text: '"Saul! I have heard you carry letters for Damascus. It is a long road to travel without companions."' },
        { speaker: 'Barnabas', text: '"I will join you on this mission. My family has connections in Damascus \u2014 I know the road well. Count me in." He grips your arm in agreement.' },
      ],
      onComplete: 'recruit_companion',
    },
    {
      id: 'lucius', name: 'Temple Soldier', trueName: 'Lucius',
      x: -14, z: 35,
      bodyColor: 0x4a4a3a, accentColor: 0x7a6a50, headColor: 0x8a5830,
      dialogues: [
        { speaker: 'Temple Soldier', text: '"Move along, citizen. I am on duty. No loitering in the road."' },
        { speaker: 'Temple Soldier', text: '"Jerusalem is under the authority of the Sanhedrin. Mind your step."' },
      ],
      dialoguesAlt: [
        { speaker: 'Lucius', text: '"Shalom, Saul. I am Lucius, from Cyrene. I have traveled many long roads and know how to keep pace on a journey."' },
        { speaker: 'Lucius', text: '"If you travel for the Sanhedrin, I will lend my company. I am not afraid of the road." He straightens his cloak. "I will go with you."' },
      ],
      onComplete: 'recruit_companion',
    },
    {
      id: 'silas', name: 'Temple Soldier', trueName: 'Silas',
      x: 16, z: 18,
      bodyColor: 0x4a5040, accentColor: 0x7a7060, headColor: 0xb08060,
      dialogues: [
        { speaker: 'Temple Soldier', text: '"State your business, traveler. Keep moving if you have none here."' },
        { speaker: 'Temple Soldier', text: '"The Temple guard keeps order in these streets. Stay on the road and cause no trouble."' },
      ],
      dialoguesAlt: [
        { speaker: 'Silas', text: '"The Damascus road? I know it well \u2014 my family is from there. Three days through Judea and into Syria."' },
        { speaker: 'Silas', text: '"It has been too long since I\'ve seen Damascus. I will join your company, Saul. The journey will be safer with more men."' },
      ],
      onComplete: 'recruit_companion',
    },
    {
      id: 'manaen', name: 'Temple Soldier', trueName: 'Manaen',
      x: 3, z: 44,
      bodyColor: 0x5a4030, accentColor: 0x9a7040, headColor: 0xc09060,
      dialogues: [
        { speaker: 'Temple Soldier', text: '"Peace, traveler. Keep the law and you have nothing to fear in this city."' },
        { speaker: 'Temple Soldier', text: '"The gates close at sundown. Make certain you are within the walls before dark."' },
      ],
      dialoguesAlt: [
        { speaker: 'Manaen', text: '"I am a craftsman \u2014 a tent-maker by trade, like yourself, Saul. I can tend horses and make camp on the road."' },
        { speaker: 'Manaen', text: '"\"Whatsoever thy hand findeth to do, do it with thy might.\" \u2014 Ecclesiastes 9:10. I am with you. Let me know when we depart."' },
      ],
      onComplete: 'recruit_companion',
    },

    // ── Economy NPCs ────────────────────────────────────────
    {
      id: 'miriam_cloth', name: 'Miriam',
      x: 5, z: 23,
      bodyColor: 0xb06080, accentColor: 0xe090b0, headColor: 0xb07840,
      trueName: 'Miriam',
      dialogues: [
        { speaker: 'Miriam', text: '"Shalom, traveler. My family has traded cloth in this market for three generations — woven strong enough to shelter a man through any desert wind."' },
        { speaker: 'Miriam', text: '"Bring my cloth south to Benjamin the Weaver near the stables. He will turn it into a proper tent. The caravans heading north pay well for a good one."' },
        { speaker: 'Miriam', text: '"Two shekels a bolt. Three bolts makes a full tent — the wiser purchase if you mean to turn a profit. What will it be?"' },
      ],
      onComplete: 'offer_cloth',
    },
    {
      id: 'loom_keeper', name: 'Benjamin the Weaver',
      x: 9, z: 40,
      trueName: 'Benjamin',
      bodyColor: 0x506870, accentColor: 0x8098a8, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Benjamin', text: '"Ah, you have tent cloth! Bring it here and I will weave it into a fine tent for you. It will fetch a good price."' },
        { speaker: 'Benjamin', text: '"There \u2014 a sturdy tent, worthy of any desert camp. Take it to Joseph down the road. He always needs good tents for the caravans."' },
      ],
      onComplete: 'craft_tent',
    },
    {
      id: 'joseph_buyer', name: 'Joseph the Merchant',
      x: -3, z: 29,
      bodyColor: 0x706040, accentColor: 0xa09060, headColor: 0xb08050,
      dialogues: [
        { speaker: 'Joseph', text: '"A fine tent! I have caravans heading to Egypt next week and they always need good shelters for the journey."' },
        { speaker: 'Joseph', text: '"I will pay you 5 shekels for this. A fair price \u2014 your craftsmanship is evident." He counts out the coins and places them in your hand.' },
      ],
      onComplete: 'sell_tent',
    },
    {
      id: 'stable_master', name: 'Elias the Stable Master',
      x: 20, z: 44,
      bodyColor: 0x4a5040, accentColor: 0x7a8070, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Elias', text: '"Fine horses for the Damascus road! I have five strong animals ready. They are well-fed and rested."' },
        { speaker: 'Elias', text: '"Five horses for the Damascus road \u2014 that will be 15 shekels. A fair price for animals that will carry you safely through the wilderness." He awaits your answer.' },
      ],
      onComplete: 'buy_horses',
    },

    // ── Roman Soldiers (patrolling) ──────────────────────────
    {
      id: 'roman_1', name: 'Roman Soldier',
      x: 2.8, z: 12,
      isRomanSoldier: true,
      bodyColor: 0x7a1818, accentColor: 0xd4a830, headColor: 0xb07840,
      patrol: [2.8, 8, 2.8, 22],
      dialogues: [
        { speaker: 'Roman Soldier', text: '"Move along, citizen. These streets are under Roman authority. Rome keeps the peace \u2014 and we intend to keep it."' },
        { speaker: 'Roman Soldier', text: '"The Pax Romana holds in Jerusalem. Cause no trouble and you have nothing to fear from us."' },
      ],
      onComplete: null,
    },
    {
      id: 'roman_2', name: 'Roman Soldier',
      x: -12, z: 20,
      isRomanSoldier: true,
      bodyColor: 0x7a1818, accentColor: 0xd4a830, headColor: 0xb07840,
      patrol: [-12, 14, -12, 30],
      dialogues: [
        { speaker: 'Roman Soldier', text: '"Halt. State your business in this quarter."' },
        { speaker: 'Roman Soldier', text: '"We watch this district carefully. The Sanhedrin and Rome share an interest in order. Go about your business."' },
      ],
      onComplete: null,
    },
    {
      id: 'roman_3', name: 'Roman Soldier',
      x: 13, z: 36,
      isRomanSoldier: true,
      bodyColor: 0x7a1818, accentColor: 0xd4a830, headColor: 0xb07840,
      patrol: [13, 28, 13, 44],
      dialogues: [
        { speaker: 'Roman Soldier', text: '"Damascus road, is it? Long journey. Keep to Caesar\u2019s roads and you will arrive safely enough."' },
        { speaker: 'Roman Soldier', text: '"We have little love for these Jewish sectarians \u2014 if they cause trouble, the empire will deal with them eventually."' },
      ],
      onComplete: null,
    },

    // ── Ambient Townspeople ──────────────────────────────────
    {
      id: 'townsfolk_1', name: 'Townsman',
      x: -10, z: 8,
      bodyColor: 0x6a5040, accentColor: 0x9a7860, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Townsman', text: '"Did you hear? Saul dragged away three families from the lower city last week. Men and women both, bound in chains."' },
        { speaker: 'Townsman', text: '"\"As for Saul, he made havoc of the church, entering into every house.\" \u2014 Acts 8:3. God have mercy on them."' },
      ],
      onComplete: null,
    },
    {
      id: 'townsfolk_2', name: 'Townswoman',
      x: 10, z: 10,
      bodyColor: 0xa05060, accentColor: 0xd08090, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Townswoman', text: '"My neighbor was taken in the night. Her only crime was praying in Jesus\u2019 name. I fear for my own family now."' },
        { speaker: 'Townswoman', text: '"The believers scattered from Jerusalem since Stephen was stoned. Judea, Samaria \u2014 they carry the news everywhere they go."' },
      ],
      onComplete: null,
    },
    {
      id: 'townsfolk_3', name: 'Elder',
      x: -8, z: 30,
      bodyColor: 0x7a6a50, accentColor: 0xaaa080, headColor: 0xd0b090,
      dialogues: [
        { speaker: 'Elder', text: '"I remember Stephen\u2019s face as they stoned him. He looked\u2026 peaceful. He said he saw heaven opened and Jesus standing at the right hand of God."' },
        { speaker: 'Elder', text: '"Whether he was right or wrong, no man should die for his beliefs. These are very troubled times in Jerusalem."' },
      ],
      onComplete: null,
    },
    {
      id: 'townsfolk_4', name: 'Young Merchant',
      x: 16, z: 22,
      bodyColor: 0x605040, accentColor: 0x908060, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Young Merchant', text: '"Business has been terrible. Half my customers have fled Jerusalem since the persecution started."' },
        { speaker: 'Young Merchant', text: '"I heard a group even went as far as Antioch \u2014 preaching to Greeks! Can you imagine? The whole world is changing."' },
      ],
      onComplete: null,
    },
    {
      id: 'townsfolk_5', name: 'Shepherd',
      x: 3, z: 38,
      bodyColor: 0x7a6040, accentColor: 0xa08060, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Shepherd', text: '"I drive my flock through here each morning. Used to be such a peaceful city \u2014 everyone knew their neighbor."' },
        { speaker: 'Shepherd', text: '"\"The LORD is my shepherd; I shall not want.\" \u2014 Psalm 23:1. That is enough for me. I trust Him with the rest."' },
      ],
      onComplete: null,
    },

    // ── Sanhedrin Elder (dramatic irony near temple) ─────────
    {
      id: 'sanhedrin_elder', name: 'Sanhedrin Elder',
      x: 5, z: -6,
      bodyColor: 0x2a3a6a, accentColor: 0x5a6aaa, headColor: 0xd0b090,
      dialogues: [
        { speaker: 'Elder of the Sanhedrin', text: '"Saul! The name of God is blessed for raising up a man of your zeal. You are a fire in this cold generation."' },
        { speaker: 'Elder of the Sanhedrin', text: '"These followers of The Way are a cancer in the body of Israel. What you do in Damascus \u2014 it is the will of the Almighty."' },
        { speaker: 'Elder of the Sanhedrin', text: '"Go with our full blessing. Root out every last one of them and bring them back in chains. History will remember your faithfulness."' },
      ],
      onComplete: null,
    },

    // ── Hidden Believers (optional moral choice encounters) ──
    {
      id: 'believer_1', name: 'Hidden Follower',
      x: -22, z: 16,
      bodyColor: 0x506040, accentColor: 0x708060, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Follower', text: 'A man sees you coming and freezes, clutching a small scroll to his chest. His eyes fill with fear.' },
        { speaker: 'Follower', text: '"Please\u2026 I have a family. I have done nothing but pray and break bread with friends. We follow The Way."' },
      ],
      onComplete: 'believer_choice',
    },
    {
      id: 'believer_2', name: 'Hidden Follower',
      x: 24, z: 33,
      bodyColor: 0x5a6050, accentColor: 0x8a9080, headColor: 0xb07840,
      dialogues: [
        { speaker: 'Follower', text: 'A woman presses against the wall as you approach, eyes wide. She has been hiding here, clutching a child\u2019s hand.' },
        { speaker: 'Follower', text: '"I follow The Way. I know what that means to you. Do what you must\u2026 but know that Jesus is risen. I will not deny it."' },
      ],
      onComplete: 'believer_choice',
    },
  ],

  // ────────────────────────────────────────────────────────
  buildings: [

    // ── Temple platform ─────────────────────────────────────
    { x: 0, z: -17, w: 22, d: 13, h: 1.2, color: 0xd8d0a0 },

    // ── Temple walls ────────────────────────────────────────
    { x: 0,     z: -22.5, w: 22,  d: 1.5, h: 7.5, color: 0xe8e0c0, roofColor: 0xd0c890 },
    { x: -10.5, z: -17,   w: 1.5, d: 13,  h: 7.5, color: 0xe8e0c0, roofColor: 0xd0c890 },
    { x:  10.5, z: -17,   w: 1.5, d: 13,  h: 7.5, color: 0xe8e0c0, roofColor: 0xd0c890 },
    { x: -6,    z: -11.2, w: 10,  d: 1.5, h: 7.0, color: 0xe8e0c0, roofColor: 0xd0c890 },
    { x:  6,    z: -11.2, w: 10,  d: 1.5, h: 7.0, color: 0xe8e0c0, roofColor: 0xd0c890 },

    // ── Temple altar ────────────────────────────────────────
    { x: 0, z: -20.5, w: 2.5, d: 2.5, h: 1.4, color: 0xcfc890, roofColor: 0xe0d8a0 },

    // ── Grand staircase (5 tiers, tallest nearest temple) ───
    { x: 0, z: -10.45, w: 7,  d: 0.52, h: 1.10, color: 0xd0c890 },
    { x: 0, z:  -9.93, w: 8,  d: 0.52, h: 0.88, color: 0xcbbe80 },
    { x: 0, z:  -9.41, w: 9,  d: 0.52, h: 0.66, color: 0xc5b870 },
    { x: 0, z:  -8.89, w: 10, d: 0.52, h: 0.44, color: 0xc0b260 },
    { x: 0, z:  -8.37, w: 11, d: 0.52, h: 0.22, color: 0xbca850 },

    // ── Front colonnade (5 columns) ─────────────────────────
    { x: -4, z: -11.4, w: 0.65, d: 0.65, h: 6.5, color: 0xf0ead0 },
    { x: -2, z: -11.4, w: 0.65, d: 0.65, h: 6.5, color: 0xf0ead0 },
    { x:  2, z: -11.4, w: 0.65, d: 0.65, h: 6.5, color: 0xf0ead0 },
    { x:  4, z: -11.4, w: 0.65, d: 0.65, h: 6.5, color: 0xf0ead0 },

    // ── Left side colonnade (4 columns) ─────────────────────
    { x: -9, z: -13.5, w: 0.6, d: 0.6, h: 5.8, color: 0xf0ead0 },
    { x: -9, z: -15.5, w: 0.6, d: 0.6, h: 5.8, color: 0xf0ead0 },
    { x: -9, z: -17.5, w: 0.6, d: 0.6, h: 5.8, color: 0xf0ead0 },
    { x: -9, z: -19.5, w: 0.6, d: 0.6, h: 5.8, color: 0xf0ead0 },

    // ── Right side colonnade (4 columns) ────────────────────
    { x: 9,  z: -13.5, w: 0.6, d: 0.6, h: 5.8, color: 0xf0ead0 },
    { x: 9,  z: -15.5, w: 0.6, d: 0.6, h: 5.8, color: 0xf0ead0 },
    { x: 9,  z: -17.5, w: 0.6, d: 0.6, h: 5.8, color: 0xf0ead0 },
    { x: 9,  z: -19.5, w: 0.6, d: 0.6, h: 5.8, color: 0xf0ead0 },

    // ── Flanking buildings near temple ──────────────────────
    { x:  11, z: -8.5, w: 4.5, d: 3.5, h: 3.5, color: 0x9b6535, roofColor: 0x7a4820 },
    { x:  11, z: -4.5, w: 4.5, d: 3.5, h: 3.0, color: 0x8a5a2a, roofColor: 0x6a3810 },
    { x: -11, z: -8.5, w: 4.5, d: 3.5, h: 3.5, color: 0x9b6535, roofColor: 0x7a4820 },
    { x: -11, z: -4.5, w: 4.5, d: 3.5, h: 3.0, color: 0x8a5a2a, roofColor: 0x6a3810 },

    // ── Western residential ─────────────────────────────────
    { x: -18, z: 11,  w: 5, d: 4, h: 3.2, color: 0xa06a40, roofColor: 0x7a4820 },
    { x: -23, z: 11,  w: 5, d: 4, h: 2.8, color: 0x8a5a30, roofColor: 0x6a3818 },
    { x: -28, z: 10,  w: 5, d: 4, h: 3.0, color: 0x9a6438, roofColor: 0x7a4420 },
    { x: -19, z: 27,  w: 5, d: 4, h: 3.2, color: 0xa07040, roofColor: 0x7a4820 },
    { x: -25, z: 27,  w: 5, d: 4, h: 2.8, color: 0x8a6035, roofColor: 0x6a3818 },
    { x: -18, z: 33,  w: 5, d: 4, h: 3.0, color: 0xa06435, roofColor: 0x7a4018 },
    { x: -24, z: 35,  w: 5, d: 4, h: 2.6, color: 0x8a5a2a, roofColor: 0x6a3010 },
    { x: -20, z: 43,  w: 5, d: 4, h: 3.0, color: 0xa06040, roofColor: 0x7a3820 },
    { x: -26, z: 43,  w: 5, d: 4, h: 2.8, color: 0x905830, roofColor: 0x703018 },

    // ── Eastern residential ─────────────────────────────────
    { x: 19,  z: 11,  w: 5, d: 4, h: 3.0, color: 0x9a6438, roofColor: 0x7a3818 },
    { x: 25,  z: 11,  w: 5, d: 4, h: 2.8, color: 0x8a5a30, roofColor: 0x6a3010 },
    { x: 20,  z: 27,  w: 5, d: 4, h: 3.2, color: 0xa06840, roofColor: 0x7a4020 },
    { x: 26,  z: 27,  w: 5, d: 4, h: 2.8, color: 0x8a5838, roofColor: 0x6a3818 },
    { x: 19,  z: 33,  w: 5, d: 4, h: 3.0, color: 0x9a6035, roofColor: 0x7a3818 },

    // ── Central well (off road, beside main path) ───────────
    { x: 5.5, z: 19, w: 1.6, d: 1.6, h: 0.85, color: 0x7a5a30 },
    { x: 4.85, z: 19, w: 0.12, d: 0.12, h: 2.3, color: 0x5a3a18 },
    { x: 6.15, z: 19, w: 0.12, d: 0.12, h: 2.3, color: 0x5a3a18 },
    { x: 5.5,  z: 19, w: 1.4,  d: 0.12, h: 0.12, color: 0x5a3a18 },

    // ── Craftsmen's quarter ─────────────────────────────────
    { x:  7, z: 33, w: 6, d: 5, h: 3.5, color: 0x7a5a40, roofColor: 0x5a3a20 },
    { x: -7, z: 33, w: 5, d: 4, h: 3.0, color: 0x6a5a38, roofColor: 0x4a3818 },
    { x: 8, z: 43, w: 5, d: 4, h: 3.5, color: 0x5a6a7a, roofColor: 0x3a4a5a },

    // ── Stable hut (pen built in code) ──────────────────────
    { x: 25, z: 37, w: 5, d: 4, h: 2.5, color: 0x7a6050, roofColor: 0x5a4030 },

    // ── South gate (moved to z:55) ──────────────────────────
    { x: -8, z: 55, w: 12, d: 1.5, h: 3.0, color: 0x6b4020 },
    { x:  8, z: 55, w: 12, d: 1.5, h: 3.0, color: 0x6b4020 },
    { x: -2, z: 55, w: 0.7, d: 0.7, h: 3.5, color: 0x4a2808 },
    { x:  2, z: 55, w: 0.7, d: 0.7, h: 3.5, color: 0x4a2808 },
  ],

  paths: [
    { x: 0,   z: 15,   w: 4,   d: 86,  color: 0x9a8870 },  // main N-S (z -28 to 58)
    { x: 0,   z: 5,    w: 65,  d: 2.5, color: 0x9a8870, y: 0.065 },  // upper E-W
    { x: 0,   z: 22,   w: 65,  d: 2.5, color: 0x9a8870, y: 0.065 },  // central E-W
    { x: 0,   z: 38,   w: 45,  d: 2.5, color: 0x9a8870, y: 0.065 },  // southern E-W
    { x: -14, z: 28,   w: 2.5, d: 46,  color: 0x8a7860, y: 0.10 },   // west alley (z:5–51)
    { x:  14, z: 28,   w: 2.5, d: 46,  color: 0x8a7860, y: 0.10 },   // east alley (z:5–51)
    { x: 0,   z: -15.5, w: 10,  d: 5,  color: 0xd8d0a0, y: 0.065 },  // temple courtyard
  ],

  palms: [
    { x: -12, z:  2 }, { x: 12, z:  2 },
    { x: -12, z: -2 }, { x: 12, z: -2 },
    { x: -11, z:  9 }, { x: 11, z:  9 },
    { x: -17, z: 15 }, { x: 17, z: 15 },
    { x: -12, z: 20 }, { x: 12, z: 20 },
    { x: -16, z: 30 }, { x: 16, z: 30 },
    { x: -12, z: 40 }, { x: 12, z: 40 },
    { x: -13, z: 50 }, { x: 13, z: 50 },
    { x: -22, z: 17 }, { x: 22, z: 17 },
    { x: -22, z: 28 }, { x: 22, z: 28 },
    { x: -22, z: 40 }, { x: 30, z: 40 },
  ],

  stalls: [
    { x: -7, z: 3,  color: 0xc03020 },
    { x: -4, z: 3,  color: 0x9030a0 },
    { x:  4, z: 7,  color: 0xb04820 },
    { x:  7, z: 7,  color: 0xe06010 },
    { x: -7, z: 7,  color: 0xe07020 },
    { x:  7, z: 3,  color: 0xb02030 },
    { x: -5, z: 18, color: 0x40a060 },
    { x:  5, z: 18, color: 0x8040c0 },
    { x: -8, z: 15, color: 0xd04030 },
    { x:  8, z: 15, color: 0xc06830 },
  ],

  decorations: [
    { type: 'pot',  x: -2.5, z: -10.5 },
    { type: 'pot',  x:  2.5, z: -10.5 },
    { type: 'pot',  x: -1.5, z:  18 },
    { type: 'pot',  x:  1.5, z:  18 },
    { type: 'pot',  x: -1.5, z:  30 },
    { type: 'pot',  x:  1.5, z:  30 },
    { type: 'lamp', x: -3.5, z:  0 },
    { type: 'lamp', x:  3.5, z:  0 },
    { type: 'lamp', x: -3.5, z:  9 },
    { type: 'lamp', x:  3.5, z:  9 },
    { type: 'lamp', x: -3.5, z: 22 },
    { type: 'lamp', x:  3.5, z: 22 },
    { type: 'lamp', x: -3.5, z: 38 },
    { type: 'lamp', x:  3.5, z: 38 },
  ],

  signs: [
    {
      id: 'sign_market', x: 3.5, z: 1.2,
      label: 'Market Notice',
      text: 'JERUSALEM MARKET\n\n\"A false balance is abomination to the LORD: but a just weight is his delight.\"\n\u2014 Proverbs 11:1',
    },
    {
      id: 'sign_temple', x: 3.5, z: -9.6,
      label: 'Temple Inscription',
      text: 'HOLY TEMPLE OF THE LORD\n\nEnter with reverence. Remove thy sandals.\n\n\"My house shall be called a house of prayer for all people.\"\n\u2014 Isaiah 56:7',
    },
    {
      id: 'sign_damascus', x: 3.5, z: 53.4,
      label: 'Road Marker',
      text: 'ROAD TO DAMASCUS\n\nThree days journey north through the Judean wilderness.\nAll travelers must carry letters of passage from Jerusalem.',
    },
  ],

  // AABB collision boxes {minX, maxX, minZ, maxZ}
  colliders: [
    // ── Temple perimeter ────────────────────────────────────
    { minX: -11, maxX:  11,  minZ: -23.5, maxZ: -21.5 },

    // ── Temple front columns (5) — entrance gap at x:±0.9 ──
    { minX: -4.33, maxX: -3.67, minZ: -11.73, maxZ: -11.07 },
    { minX: -2.33, maxX: -1.67, minZ: -11.73, maxZ: -11.07 },
    { minX:  1.67, maxX:  2.33, minZ: -11.73, maxZ: -11.07 },
    { minX:  3.67, maxX:  4.33, minZ: -11.73, maxZ: -11.07 },

    // ── Left side columns (4) ────────────────────────────────
    { minX: -9.3, maxX: -8.7, minZ: -13.8, maxZ: -13.2 },
    { minX: -9.3, maxX: -8.7, minZ: -15.8, maxZ: -15.2 },
    { minX: -9.3, maxX: -8.7, minZ: -17.8, maxZ: -17.2 },
    { minX: -9.3, maxX: -8.7, minZ: -19.8, maxZ: -19.2 },

    // ── Right side columns (4) ───────────────────────────────
    { minX: 8.7, maxX: 9.3, minZ: -13.8, maxZ: -13.2 },
    { minX: 8.7, maxX: 9.3, minZ: -15.8, maxZ: -15.2 },
    { minX: 8.7, maxX: 9.3, minZ: -17.8, maxZ: -17.2 },
    { minX: 8.7, maxX: 9.3, minZ: -19.8, maxZ: -19.2 },
    { minX: -12, maxX: -10,  minZ: -24,   maxZ: -10.5 },
    { minX:  10, maxX:  12,  minZ: -24,   maxZ: -10.5 },
    { minX: -12, maxX: -1.5, minZ: -12,   maxZ: -10.8 },
    { minX:  1.5, maxX: 12,  minZ: -12,   maxZ: -10.8 },
    { minX: -1.3, maxX: 1.3, minZ: -21.8, maxZ: -19.2 },

    // ── Flanking buildings ──────────────────────────────────
    { minX:  8.5, maxX: 13,   minZ: -10.5, maxZ: -7   },
    { minX:  8.5, maxX: 13,   minZ:  -6.5, maxZ: -2.5 },
    { minX: -13,  maxX: -8.5, minZ: -10.5, maxZ: -7   },
    { minX: -13,  maxX: -8.5, minZ:  -6.5, maxZ: -2.5 },

    // ── Market stalls (tight — table footprint only) ────────
    { minX: -8,  maxX: -6,  minZ: 2.4,  maxZ: 3.6 },
    { minX: -5,  maxX: -3,  minZ: 2.4,  maxZ: 3.6 },
    { minX:  6,  maxX:  8,  minZ: 2.4,  maxZ: 3.6 },
    { minX:  3,  maxX:  5,  minZ: 6.4,  maxZ: 7.6 },
    { minX:  6,  maxX:  8,  minZ: 6.4,  maxZ: 7.6 },
    { minX: -8,  maxX: -6,  minZ: 6.4,  maxZ: 7.6 },
    // Extended market stalls
    { minX: -6,  maxX: -4,  minZ: 17.4, maxZ: 18.6 },
    { minX:  4,  maxX:  6,  minZ: 17.4, maxZ: 18.6 },
    { minX: -9,  maxX: -7,  minZ: 14.4, maxZ: 15.6 },
    { minX:  7,  maxX:  9,  minZ: 14.4, maxZ: 15.6 },

    // ── Lamp posts ──────────────────────────────────────────
    { minX: -3.65, maxX: -3.35, minZ: -0.15,  maxZ:  0.15  },
    { minX:  3.35, maxX:  3.65, minZ: -0.15,  maxZ:  0.15  },
    { minX: -3.65, maxX: -3.35, minZ:  8.85,  maxZ:  9.15  },
    { minX:  3.35, maxX:  3.65, minZ:  8.85,  maxZ:  9.15  },
    { minX: -3.65, maxX: -3.35, minZ: 21.85,  maxZ: 22.15  },
    { minX:  3.35, maxX:  3.65, minZ: 21.85,  maxZ: 22.15  },
    { minX: -3.65, maxX: -3.35, minZ: 37.85,  maxZ: 38.15  },
    { minX:  3.35, maxX:  3.65, minZ: 37.85,  maxZ: 38.15  },

    // ── Sign posts ──────────────────────────────────────────
    { minX: 3.3,  maxX: 3.7,  minZ:  0.95,  maxZ:  1.45  },
    { minX: 3.3,  maxX: 3.7,  minZ: -9.85,  maxZ: -9.35  },
    { minX: 3.3,  maxX: 3.7,  minZ: 53.15,  maxZ: 53.65  },

    // ── Central well ────────────────────────────────────────
    { minX: 4.6, maxX: 6.4, minZ: 18.2, maxZ: 19.8 },

    // ── Western residential ─────────────────────────────────
    { minX: -20.5, maxX: -15.5, minZ:  9,  maxZ: 13 },
    { minX: -25.5, maxX: -20.5, minZ:  9,  maxZ: 13 },
    { minX: -30.5, maxX: -25.5, minZ:  8,  maxZ: 12 },
    { minX: -21.5, maxX: -16.5, minZ: 25,  maxZ: 29 },
    { minX: -27.5, maxX: -22.5, minZ: 25,  maxZ: 29 },
    { minX: -20.5, maxX: -15.5, minZ: 31,  maxZ: 35 },
    { minX: -26.5, maxX: -21.5, minZ: 33,  maxZ: 37 },
    { minX: -22.5, maxX: -17.5, minZ: 41,  maxZ: 45 },
    { minX: -28.5, maxX: -23.5, minZ: 41,  maxZ: 45 },

    // ── Eastern residential ─────────────────────────────────
    { minX: 16.5, maxX: 21.5, minZ:  9,  maxZ: 13 },
    { minX: 22.5, maxX: 27.5, minZ:  9,  maxZ: 13 },
    { minX: 17.5, maxX: 22.5, minZ: 25,  maxZ: 29 },
    { minX: 23.5, maxX: 28.5, minZ: 25,  maxZ: 29 },
    { minX: 16.5, maxX: 21.5, minZ: 31,  maxZ: 35 },

    // ── Craftsmen's quarter ─────────────────────────────────
    { minX:  4,   maxX: 10,   minZ: 30.5, maxZ: 35.5 },
    { minX: -9.5, maxX: -4.5, minZ: 31,   maxZ: 35   },
    { minX:  5.5, maxX: 10.5, minZ: 41,   maxZ: 45   },

    // ── Temple menorah (interior) ────────────────────────────
    { minX: -0.4, maxX: 0.4,  minZ: -16.9, maxZ: -16.1 },

    // ── Stable hut ──────────────────────────────────────────
    { minX: 22.5, maxX: 27.5, minZ: 35, maxZ: 39 },
    // Pen fence walls (north/south/east sides, west side open)
    { minX: 17, maxX: 27, minZ: 41, maxZ: 41.4 },
    { minX: 17, maxX: 27, minZ: 49, maxZ: 49.4 },
    { minX: 26.6, maxX: 27, minZ: 41, maxZ: 49 },

    // ── South gate wall (moved to z:55) ─────────────────────
    { minX: -14, maxX:  -2, minZ: 54, maxZ: 57 },
    { minX:   2, maxX:  14, minZ: 54, maxZ: 57 },

    // ── World north border ──────────────────────────────────
    { minX: -38, maxX: 38, minZ: -28, maxZ: -27 },
  ],
};
