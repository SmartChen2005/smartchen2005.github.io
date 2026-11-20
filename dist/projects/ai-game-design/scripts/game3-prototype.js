const RADIUS = 3;
const DEPLOYMENT_HEXES = [{q:0,r:2},{q:-1,r:2},{q:1,r:1},{q:0,r:3}];
const PARTY_DEPLOYMENT_HEXES = [{q:-2,r:2},{q:-1,r:2},{q:0,r:2},{q:1,r:1},{q:1,r:2},{q:0,r:3}];
const NEIGHBORS = [{q:1,r:0},{q:1,r:-1},{q:0,r:-1},{q:-1,r:0},{q:-1,r:1},{q:0,r:1}];
const DITING_OPENING_GUARDS = [{q:-1,r:-1},{q:1,r:-2}];
const DITING_WAVE_COUNTS = [3,4,5];
const MYTHIC_TECHNIQUES=['focusedstaff','ruyithrow'];
const JOURNEY_REWARD_OWNERS=['wukong','bajie','tang','wujing'];
const PARTY_SKILLS={
  wukong:{name:'Sun Wukong',cn:'孙悟空',options:[
    {id:'cloudstep',name:'Cloud Step',cn:'云步',sigil:'云',short:'After moving, the next strike deals 130% ATK.'},
    {id:'focusedstaff',name:'Heart-Steadying Staff',cn:'定心棍',sigil:'定',short:'Every third strike deals 180% ATK.'},
    {id:'longstaff',name:'Wishful Reach',cn:'如意伸长',sigil:'长',short:'Normal attack Range becomes 2.'},
    {id:'ruyithrow',name:'Wishful Staff Throw',cn:'掷棒',sigil:'掷',short:'Every fifth attack crosses a line and returns.'},
    {id:'sweep',name:'Sweeping Arc',cn:'横扫',sigil:'扫',short:'Every third attack hits a small area.'},
    {id:'somersault',name:'Somersault Raid',cn:'筋斗袭',sigil:'跃',short:'Leap to a distant target, strike, then return.'},
    {id:'massfreeze',name:'Binding Spell',cn:'群体定身法',sigil:'定',active:true,durationMs:3000,usesPerJourney:1,description:'Stun all enemies for 3s.',short:'ACTIVE · Stun all enemies for 3s. Once per Journey.'},
    {id:'cloudstaff',name:'Cloud-Sweeping Staff',cn:'云棍',sigil:'风',short:'Strike enemies up to 3 Hexes away.'},
    {id:'goldengaze',name:'Fiery Eyes, Golden Sight',cn:'火眼金睛',sigil:'睛',short:'Prioritize bosses; the first hit exposes them.'},
    {id:'adamant',name:'Adamant Body',cn:'金刚躯',sigil:'刚',short:'Halve the first damaging hit.'},
    {id:'bodyfixing',name:'Body-Fixing Spell',cn:'定身法',sigil:'定',short:'Every fourth strike Stuns its target.'},
    {id:'cloudescort',name:'Cloud Escort',cn:'护行云',sigil:'护',short:'After moving, Ward the weakest adjacent ally.'}
  ]},
  bajie:{name:'Zhu Bajie',cn:'猪八戒',options:[
    {id:'shieldring',name:'Shield Ring',cn:'护圈',sigil:'护',short:'Adjacent allies begin with Ward.'},
    {id:'charge',name:'Shoulder Charge',cn:'冲阵',sigil:'冲',short:'First move ends with a 130% rushing strike.'},
    {id:'rakesweep',name:'Rake Sweep',cn:'钉耙横扫',sigil:'耙',short:'Every third attack hits a small area.'},
    {id:'roadblock',name:'Roadblock',cn:'拦路',sigil:'拦',short:'Nearby enemies target Bajie first.'},
    {id:'crowdbreaker',name:'Crowd Breaker',cn:'破围',sigil:'破',short:'With 2 nearby foes, stagger them once.'},
    {id:'movingwall',name:'Moving Wall',cn:'移墙',sigil:'墙',short:'After moving, Ward adjacent allies.'},
    {id:'longrake',name:'Hooking Rake',cn:'长耙钩',sigil:'钩',short:'Attack at Range 2; pull the target closer.'},
    {id:'thickhide',name:'Thick Hide',cn:'厚皮',sigil:'厚',short:'Gain Ward while adjacent to 2 allies.'},
    {id:'lastmeal',name:'Last Meal',cn:'饱战',sigil:'食',short:'Below half HP, heal 8 after attacking.'},
    {id:'backswing',name:'Backswing',cn:'回耙',sigil:'回',short:'Every fourth hit strikes the target and its rear neighbor.'},
    {id:'bajiereturn',name:'Return to the Master',cn:'护师归阵',sigil:'归',short:'Every third turn, leap back beside Tang Sanzang if separated.'},
    {id:'rakebrace',name:'Rake Brace',cn:'钉耙护主',sigil:'架',short:'Every third turn beside Tang Sanzang, Ward them both.'}
  ]},
  wujing:{name:'Sha Wujing',cn:'沙悟净',options:[
    {id:'guardcircle',name:'Guard Circle',cn:'护法圈',sigil:'守',short:'Adjacent allies gain Ward every third turn.'},
    {id:'tidalwave',name:'Great Wave',cn:'巨浪退敌',sigil:'浪',active:true,usesPerJourney:1,description:'Sweep all enemies to the far edge.',short:'ACTIVE · Sweep all enemies to the far edge. Once per Journey.'},
    {id:'staffline',name:'Crescent Line',cn:'月牙线',sigil:'线',short:'Every third attack pierces an enemy line.'},
    {id:'holdformation',name:'Hold Formation',cn:'守阵',sigil:'阵',short:'If he has not moved, adjacent allies take 25% less damage.'},
    {id:'riverstep',name:'River Step',cn:'踏流',sigil:'流',short:'After moving, Ward the weakest adjacent ally.'},
    {id:'heavyanchor',name:'Heavy Anchor',cn:'沉锚',sigil:'沉',short:'With 2 adjacent allies, Sha Wujing cannot be staggered.'},
    {id:'steadyhand',name:'Steady Hand',cn:'稳杖',sigil:'稳',short:'Each adjacent ally adds 15% to his next strike.'},
    {id:'longwatch',name:'Long Watch',cn:'远守',sigil:'远',short:'Attack threats within 2 Hexes of Tang Sanzang first.'},
    {id:'bodyguard',name:'Bodyguard',cn:'护经',sigil:'卫',short:'Tang Sanzang gains Ward while adjacent to Sha Wujing.'},
    {id:'countercurrent',name:'Countercurrent',cn:'逆流',sigil:'逆',short:'Every fourth hit splashes around the ally Sha Wujing guards.'},
    {id:'wujingreturn',name:'Scripture Recall',cn:'归经守',sigil:'归',short:'Every third turn, return beside Tang Sanzang if separated.'},
    {id:'riverrepulse',name:'River Repulse',cn:'流沙退潮',sigil:'退',short:'Every third strike pushes its target back 2 Hexes.'}
  ]},
  tang:{name:'Tang Sanzang',cn:'唐三藏',options:[
    {id:'compassion',name:'Compassion',cn:'慈悲',sigil:'慈',short:'Heal the weakest ally within 2 Hexes for 28.'},
    {id:'sutracircle',name:'Sutra Circle',cn:'经文圈',sigil:'经',short:'Heal every adjacent ally for 8 each prayer.'},
    {id:'chainprayer',name:'Chain Prayer',cn:'连祷',sigil:'祷',short:'Healing jumps to an ally adjacent to the target.'},
    {id:'stillness',name:'Stillness',cn:'止念',sigil:'止',short:'Every third prayer Wards adjacent allies.'},
    {id:'deepprayer',name:'Distant Prayer',cn:'远祷',sigil:'远',short:'Healing range becomes 3, but heals 4 less.'},
    {id:'sanctuary',name:'Sanctuary',cn:'静域',sigil:'安',short:'Allies within 2 Hexes resist 20% damage.'},
    {id:'blessing',name:'Pilgrim Blessing',cn:'行愿',sigil:'愿',short:'The ally directly ahead begins with Ward.'},
    {id:'horseguard',name:'White Dragon Guard',cn:'龙马护',sigil:'马',short:'First adjacent enemy is staggered.'},
    {id:'goldenbody',name:'Golden Form',cn:'金身',sigil:'金',active:true,durationMs:3000,usesPerJourney:1,description:'Take no damage for 3s.',short:'ACTIVE · Take no damage for 3s. Once per Journey.'},
    {id:'sharedburden',name:'Shared Burden',cn:'共担',sigil:'共',short:'Adjacent allies split fatal damage with Tang Sanzang.'},
    {id:'banishingverse',name:'Banishing Verse',cn:'逐妖经',sigil:'逐',short:'Every third action pushes adjacent enemies 2 Hexes away.'},
    {id:'pilgrimcall',name:'Pilgrim Call',cn:'唤徒归心',sigil:'唤',short:'Every fourth prayer draws the farthest wounded ally 1 Hex closer.'}
  ]}
};
const PARTY_SKILL_LOOKUP=Object.fromEntries(Object.values(PARTY_SKILLS).flatMap(owner=>owner.options.map(skill=>[skill.id,skill])));

const TECHNIQUES = {
  focusedstaff:{id:'focusedstaff',name:'Heart-Steadying Staff',cn:'定心棍',short:'Every third close strike deals 180% ATK.'},
  ruyithrow:{id:'ruyithrow',name:'Wishful Staff Throw',cn:'掷棒',short:'Every fifth attack crosses a Hex line, then returns.'}
};

const TRAITS = {
  vigilance:{id:'vigilance',name:'Vigilance',cn:'警觉',sigil:'眼',short:'Counter the first ranged attacker.',rule:'When first hit from range, immediately mark and pursue the attacker.'},
  killing:{id:'killing',name:'Killing Intent',cn:'杀意',sigil:'刃',short:'Chain toward the weakest enemy.',rule:'After a kill, immediately mark the lowest-HP reachable enemy.'},
  sweep:{id:'sweep',name:'Sweeping Arc',cn:'横扫',sigil:'扫',short:'Every third attack becomes a ranged sweep.',rule:'Every third attack reaches 2 Hexes and deals 70% ATK to the target area.'},
  relentless:{id:'relentless',name:'Relentless',cn:'不息',sigil:'连',short:'Every fourth strike hits twice.',rule:'After three consecutive hits, the next attack strikes twice.'},
  cloudstaff:{id:'cloudstaff',name:'Cloud-Sweeping Staff',cn:'云棍',sigil:'云',short:'Strike enemies up to 3 Hexes away.',rule:'Ranged staff waves deal 75% ATK without moving.'},
  somersault:{id:'somersault',name:'Somersault Raid',cn:'筋斗袭',sigil:'跃',short:'Leap to a distant enemy, strike, then return.',rule:'Every third turn, leap up to 3 Hexes for 120% ATK and return to the original Hex.'},
  hairclone:{id:'hairclone',name:'Plucked-Hair Double',cn:'毫毛身',sigil:'身',short:'Begin with a fragile double of your full combat kit.',rule:'Summon one 45 HP double with Sun Wukong’s ATK, Range, Speed, and every skill.'},
  hairdecoy:{id:'hairdecoy',name:'Plucked-Hair Decoys',cn:'毫毛阵',sigil:'幻',short:'Begin with four fragile empty targets.',rule:'Create four 18 HP decoys. They attract attacks but cannot fight or summon.'},
  adamant:{id:'adamant',name:'Adamant Body',cn:'金刚躯',sigil:'刚',short:'Ignore half of the first damaging hit.',rule:'The first damaging hit each battle deals 50% less damage.'},
  twinstrike:{id:'twinstrike',name:'Twin Strike',cn:'双击',sigil:'双',short:'Wishful Staff Throw repeats once.',rule:'After Wishful Staff Throw returns, a second staff repeats the same outward-and-return path at 65% power.'},
  splitstaff:{id:'splitstaff',name:'Split Staff',cn:'分棍',sigil:'分',short:'Wishful Staff Throw branches toward two more foes.',rule:'Each Wishful Staff Throw adds up to two secondary targets outside its main Hex line.'},
  returning:{id:'returning',name:'Hard Return',cn:'回锋',sigil:'回',short:'The returning staff hits harder.',rule:'Wishful Staff Throw’s return path deals 80% ATK instead of 45% ATK.'},
  inkburst:{id:'inkburst',name:'Ink Burst',cn:'墨爆',sigil:'墨',short:'Destroyed Plucked-Hair Decoys stagger nearby foes.',rule:'When a Plucked-Hair Decoy falls, adjacent enemies lose their next action.'}
};
const TRAIT_ORDER=['vigilance','killing','sweep','relentless','cloudstaff','somersault','hairclone','hairdecoy','adamant','twinstrike','splitstaff','returning','inkburst'];

const UNIT_DEFINITIONS = {
  wukong:{name:'Sun Wukong',cn:'孙悟空',kind:'wukong',hp:300,atk:45,range:1,speed:4,skill:'Golden-Banded Staff',skillCopy:'A strong adjacent strike. Selected skills add its special rules.'},
  falsewukong:{name:'Six-Eared Macaque',cn:'六耳猕猴',kind:'wukong',hp:300,atk:45,range:1,speed:4,skill:'Echoed Golden Staff',skillCopy:'Exactly Sun Wukong in body, costume, weapon, and color. Only the Discarded build differs.'},
  mysterywukong:{name:'Hooded Stranger',cn:'',kind:'hooded-stranger boss wukong',hp:320,atk:24,range:1,speed:4,skill:'Borrowed Road',skillCopy:'UNCHOSEN — Uses techniques Wukong left behind. Identity unknown.'},
  leader:{name:'Bandit Chief',cn:'山贼首领',kind:'bandit boss',hp:100,atk:15,range:1,speed:2,skill:'Cutthroat Command',skillCopy:'A heavy saber leads nearby bandits forward.'},
  sword:{name:'Saber Bandit',cn:'刀匪',kind:'bandit',hp:55,atk:10,range:1,speed:2,skill:'Saber Rush',skillCopy:'Closes in with a short saber.'},
  archer:{name:'Bow Bandit',cn:'弓匪',kind:'bandit archer',hp:40,atk:8,range:3,speed:1,skill:'Ambush Shot',skillCopy:'Fires from up to three Hexes away.'},
  bajie:{name:'Zhu Bajie',cn:'猪八戒',kind:'bajie',hp:230,atk:20,range:1,speed:2,skill:'Living Rampart',skillCopy:'Nearby enemies prefer him as their target.'},
  wujing:{name:'Sha Wujing',cn:'沙悟净',kind:'wujing',hp:190,atk:24,range:1,speed:3,skill:'River Guardian',skillCopy:'Retargets enemies that attack an adjacent ally.'},
  tang:{name:'Tang Sanzang',cn:'唐三藏',kind:'tang',hp:110,atk:0,range:0,speed:1,skill:'Scripture Bearer',skillCopy:'Moves toward the most wounded allied disciple, then restores 18 HP in range.'},
  falsebajie:{name:"Zhu Bajie's Echo",cn:'假猪八戒',kind:'bajie mirror-party',hp:230,atk:20,range:1,speed:2,skill:'Echoed Rampart',skillCopy:'A gray echo carrying the path Zhu Bajie rejected.'},
  falsewujing:{name:"Sha Wujing's Echo",cn:'假沙悟净',kind:'wujing mirror-party',hp:190,atk:24,range:1,speed:3,skill:'Echoed Guardian',skillCopy:'A gray echo carrying the path Sha Wujing rejected.'},
  falsetang:{name:"Tang Sanzang's Echo",cn:'假唐三藏',kind:'tang mirror-party',hp:110,atk:0,range:0,speed:1,skill:'Echoed Scripture',skillCopy:'A gray echo who heals the most wounded imitation disciple.'},
  monkey:{name:'Mountain Monkey',cn:'猴兵',kind:'monkey-soldier',hp:90,atk:16,range:1,speed:3,skill:'Rough-Staff Swarm',skillCopy:'A rough-staff skirmisher that crowds the imitation pilgrimage.'},
  cavemonkey:{name:'Cave-Born Mimic',cn:'洞生假猴',kind:'monkey-soldier cave-spawn',hp:46,atk:9,range:1,speed:3,skill:'Caveborn Swarm',skillCopy:'A weak imitation born from the counterfeit Water Curtain Cave.'},
  watercurtain:{name:'Counterfeit Water Curtain',cn:'假水帘洞',kind:'water-curtain-cave boss spawner',hp:360,atk:0,range:0,speed:5,skill:'Endless Imitation',skillCopy:'SPAWNER — Creates 2 Cave-Born Mimics every other turn until the Cave falls.'},
  decoy:{name:'Ink Decoy',cn:'墨身',kind:'shadow',hp:20,atk:0,range:0,speed:0,skill:'Bait',skillCopy:'A fragile shape drawn by the arena.'},
  guanyin:{name:'Guanyin',cn:'观音',kind:'guanyin',hp:260,atk:34,range:4,speed:4,skill:'Lotus Protection · Holy Light',skillCopy:'LOTUS — Allies within 2 Hexes deal 25% more damage and take 25% less. LIGHT — Every 3rd turn damages a cluster and heals nearby allies.'},
  heavenly:{name:'Heavenly Soldier',cn:'天兵',kind:'heavenly-guard heaven-fighter authority',hp:999,atk:0,range:0,speed:0,skill:'Encirclement',skillCopy:'Occupies an outer-ring Hex. Cannot be crossed or attacked.'},
  diting:{name:'Diting',cn:'谛听',kind:'diting',hp:160,atk:0,range:0,speed:0,skill:'Hear All Things',skillCopy:'WITNESS — Protect Diting for 25 seconds while he listens for the true voice.'},
  underworld:{name:'Underworld Warden',cn:'阴司鬼差',kind:'underworld-guard',hp:100,atk:16,range:1,speed:3,skill:'Silence the Witness',skillCopy:'HUNTER — Ignores the duel and hunts Diting first.'},
  hairclone:{name:'Plucked-Hair Double',cn:'毫毛分身',kind:'hair-clone shadow',hp:45,atk:18,range:1,speed:3,skill:'Inherited Staff',skillCopy:'A fragile combat double. It attacks and uses inherited Techniques.'},
  hairdecoy:{name:'Plucked-Hair Decoy',cn:'毫毛假身',kind:'hair-decoy shadow',hp:18,atk:0,range:0,speed:0,skill:'Empty Double',skillCopy:'A valid target that cannot attack or create another summon.'},
  heavensoldier:{name:'Heavenly Soldier',cn:'天兵',kind:'heaven-fighter',hp:28,atk:6,range:1,speed:2,skill:'Close Ranks',skillCopy:'A weak soldier fighting as part of Heaven’s crowd.'},
  heavenarcher:{name:'Heavenly Archer',cn:'天弓手',kind:'heaven-fighter archer',hp:24,atk:5,range:3,speed:1,skill:'Piercing Volley',skillCopy:'Fires from three Hexes away.'},
  shieldgeneral:{name:'Shield General',cn:'持盾天将',kind:'heaven-fighter shield-general boss',hp:75,atk:10,range:1,speed:2,skill:'Celestial Shield',skillCopy:'The first hit against him deals half damage.'},
  lijing:{name:'Li Jing',cn:'托塔天王',kind:'li-jing heaven-fighter boss',hp:240,atk:20,range:3,speed:3,skill:'Endless Muster · Pagoda Seal',skillCopy:'MUSTER — Every 2nd turn summons 3 Ward soldiers. SEAL — Every 3rd attack deals 140% ATK.'},
  heavenlygeneral:{name:'Heavenly General',cn:'天将',kind:'heaven-fighter heavenly-general',hp:90,atk:13,range:1,speed:2,skill:'Hold the Line',skillCopy:'A durable front-rank commander.'},
  erlang:{name:'Erlang Shen',cn:'二郎神',kind:'erlang-shen boss',hp:400,atk:56,range:2,speed:6,skill:'True Sight · Battle Mirror · Third Eye · Sky Spear',skillCopy:'MIRROR — Begins with 3 Ward. EYE — Every 3rd hit finds Sun Wukong and deals 210%. SPEAR — Every 4th hit pierces for 70% ATK.'},
  heavenlyhound:{name:'Xiaotian Quan',cn:'哮天犬',kind:'heavenly-hound boss',hp:270,atk:36,range:1,speed:9,skill:'First Hunt · Scent Mark · Backline Pounce',skillCopy:'FIRST HUNT — Up to 5 bites; Decoys intercept it. POUNCE — Every 2nd later attack leaps for 150% ATK and Staggers.'},
  buddha:{name:'The Buddha',cn:'如来',kind:'buddha authority',hp:999,atk:0,range:0,speed:0,skill:'Palm of the World',skillCopy:'A combatant whose measure cannot be read. The Arena changes around him.'},
  blackbear:{name:'Black Bear Demon',cn:'黑熊怪',kind:'journey-fiend black-bear boss',hp:230,atk:26,range:1,speed:2,skill:'Mountain Hide',skillCopy:'Begins with 2 Ward and holds the center for the wolf pack.'},
  wolfspirit:{name:'Wolf Spirit',cn:'狼妖',kind:'journey-fiend wolf-spirit',hp:74,atk:12,range:1,speed:3,skill:'Pack Rush',skillCopy:'Deals 25% more damage while another wolf is adjacent to its target.'},
  yellowwind:{name:'Yellow Wind Demon',cn:'黄风怪',kind:'journey-fiend yellow-wind boss',hp:270,atk:24,range:3,speed:3,skill:'Samadhi Wind',skillCopy:'Every third attack blasts the target area and Staggers its center.'},
  windling:{name:'Windling',cn:'风精',kind:'journey-fiend windling',hp:70,atk:12,range:3,speed:3,skill:'Crosswind',skillCopy:'Long-range pressure that makes a compact formation dangerous.'},
  bonespirit:{name:'White Bone Spirit',cn:'白骨精',kind:'journey-fiend bone-spirit boss',hp:300,atk:28,range:3,speed:3,skill:'Borrowed Face',skillCopy:'Summons up to 2 Bone Guards while the bewitched disciples attack.'},
  boneguard:{name:'Bone Guard',cn:'骨兵',kind:'journey-fiend bone-guard',hp:95,atk:15,range:1,speed:2,skill:'Hollow March',skillCopy:'A durable shell with Ward.'},
  redboy:{name:'Red Boy',cn:'红孩儿',kind:'journey-fiend red-boy boss',hp:340,atk:32,range:3,speed:4,skill:'Spreading Samadhi Fire',skillCopy:'Every third attack ignites the target Hex. The fire spreads outward each time it triggers.'},
  fireimp:{name:'Fire Imp',cn:'火童',kind:'journey-fiend fire-imp',hp:82,atk:16,range:3,speed:3,skill:'Cinder Shot',skillCopy:'Stronger ranged pressure from the edges.'},
  bulldemon:{name:'Bull Demon King',cn:'牛魔王',kind:'journey-fiend bull-demon boss',hp:410,atk:35,range:2,speed:3,skill:'Mountain-Shaking Charge',skillCopy:'Every third turn, rushes up to 2 Hexes. The hit Staggers its target and shocks adjacent pilgrims.'},
  bullguard:{name:'Bull Guard',cn:'牛魔卫',kind:'journey-fiend bull-guard',hp:125,atk:19,range:1,speed:2,skill:'Iron Horns',skillCopy:'A durable frontline minion that holds space for its king.'},
  skyhorn:{name:'Cloud-Horn Raider',cn:'腾云牛妖',kind:'journey-fiend sky-horn',hp:92,atk:17,range:1,speed:4,skill:'Backline Descent',skillCopy:'Its first action lands directly on the player’s last row and strikes Sanzang.'}
};

const BATTLES = [
  {id:'stone-birth',chapter:'ACT I · PROLOGUE 00',title:'Born from Stone',speaker:'Mount Huaguo (花果山)',story:'“Before the journey, a drop of ink opens its eyes.”',objective:'AWAKEN — Break the stone and enter the world.',formationHint:'STORY SCENE — One action begins Sun Wukong’s life.',battleHint:'AWAKENING — Wind, cloud, and ink give the stone a body.',deploy:false,sequence:'birth',choiceAfter:false,enemies:[]},
  {id:'havoc',chapter:'ACT I · PROLOGUE 01',title:'Havoc in Heaven',speaker:'Sun Wukong (孙悟空)',story:'“Heaven called me a beast before it ever asked my name.”',objective:'WIN — Scatter Heaven’s 14 soldiers.',formationHint:'DRAG SUN WUKONG onto the lower field. His Mythic Loadout is active.',battleHint:'POWER SHOWCASE — Staff lines, doubles, splits, and sweeps combine automatically.',deploy:true,mythic:true,choiceAfter:false,enemies:[['heavensoldier',-3,0],['heavensoldier',-2,-1],['heavensoldier',-1,-2],['heavensoldier',0,-3],['heavensoldier',1,-3],['heavensoldier',2,-3],['heavensoldier',3,-3],['heavensoldier',3,-2],['heavensoldier',3,-1],['heavenarcher',-2,0],['heavenarcher',2,-2],['heavenarcher',2,-1],['shieldgeneral',0,-1],['shieldgeneral',1,-2]]},
  {id:'pagoda-army',chapter:'ACT I · PROLOGUE 02',title:'The Pagoda Formation',speaker:'Sun Wukong (孙悟空)',story:'“A rank for every life. A cage for everything they cannot name.”',objective:'WIN — Defeat Li Jing before his army becomes endless.',formationHint:'DRAG SUN WUKONG onto the lower field. Li Jing is fragile, but every second turn brings another Ward wave.',battleHint:'SUMMONER BOSS — 3 Ward soldiers every 2nd turn. Every 3rd Pagoda strike becomes a Seal.',deploy:true,mythic:true,choiceAfter:false,enemies:[['lijing',0,-3],['heavenlygeneral',-1,-2],['heavenlygeneral',1,-3],['shieldgeneral',0,-1],['heavensoldier',-2,-1],['heavensoldier',1,-2],['heavenarcher',-3,0],['heavenarcher',3,-3]]},
  {id:'erlang-hunt',chapter:'ACT I · PROLOGUE 03',title:'The Third Eye and the Hound',speaker:'Sun Wukong (孙悟空)',story:'“He sees what I am. That is why I cannot let him define it.”',objective:'WIN — Use four Plucked-Hair Decoys to absorb Xiaotian Quan’s opening maul.',formationHint:'DRAG SUN WUKONG onto the lower field. Xiaotian Quan acts first and attacks a Decoy before it can reach the original.',battleHint:'DUO BOSS — FIRST HUNT bites up to 5 times. Erlang Shen begins with 3 Ward and moves before Sun Wukong.',deploy:true,mythic:true,choiceAfter:false,enemies:[['erlang',0,-3],['heavenlyhound',-1,-2]]},
  {id:'buddha-palm',chapter:'ACT I · PROLOGUE 04',title:"The Buddha's Palm",speaker:'Sun Wukong (孙悟空)',story:'“If the world itself becomes the cage, what part of me remains free?”',objective:'CHALLENGE — Use Sun Wukong’s complete Mythic Loadout against the Buddha.',formationHint:'FORMATION — Place Sun Wukong anywhere on the glowing lower field. The Arena will draw him toward its center.',battleHint:'BOSS BATTLE — Each failed mythic strike pulls Sun Wukong one Hex inward before a red ring erases his doubles.',deploy:true,sequence:'buddha',choiceAfter:false,enemies:[]},
  {id:'mountain-opens',chapter:'ACT II · PROLOGUE 05',title:'The Mountain Opens',speaker:'Sun Wukong (孙悟空)',story:'“A road chosen for me can still become a road I choose.”',objective:'CONTINUE — Tang Sanzang frees Sun Wukong after five hundred years.',formationHint:'STORY SCENE — Master and disciple enter the same Arena.',battleHint:'OATH — No enemy is present. The Journey West begins.',deploy:false,sequence:'mountain',choiceAfter:false,enemies:[]},
  {id:'black-wind',chapter:'ACT II · JOURNEY 01',title:'Black Wind Ridge',speaker:'Sun Wukong (孙悟空)',story:'“The mountain did not return our finished selves. The road changes all four of us.”',objective:'PRIMARY — Defeat every enemy. PILGRIMAGE — Tang Sanzang must survive.',formationHint:'DRAG all 4 pilgrims. Only Heal, Shield, and Attack Buff Hexes stay visible.',battleHint:'PARTY GROWTH 1/6 — Defeat all enemies while protecting mounted Tang Sanzang.',deploy:true,journeyBattle:true,rewardOwners:JOURNEY_REWARD_OWNERS,enemies:[['blackbear',0,-3],['wolfspirit',-2,-1],['wolfspirit',-1,-2],['wolfspirit',1,-2],['wolfspirit',2,-3]]},
  {id:'yellow-wind',chapter:'ACT II · JOURNEY 02',title:'Yellow Wind Pass',speaker:'Zhu Bajie (猪八戒)',story:'“The wind tests every place in the formation, so every pilgrim must answer.”',objective:'PRIMARY — Defeat every enemy. PILGRIMAGE — Tang Sanzang must survive.',formationHint:'FORMATION — Use the visible skill zones to protect mounted Tang Sanzang from ranged pressure.',battleHint:'PARTY GROWTH 2/6 — Victory requires the enemies to fall and Tang Sanzang to live.',deploy:true,journeyBattle:true,rewardOwners:JOURNEY_REWARD_OWNERS,enemies:[['yellowwind',0,-3],['windling',-2,-1],['windling',-1,-2],['windling',1,-2],['windling',2,-3]]},
  {id:'white-bone',chapter:'ACT II · JOURNEY 03',title:'The Bewitched Disciple',speaker:'Tang Sanzang (唐三藏)',story:'“Zhu Bajie’s weapon is familiar. His eyes are not. Sun Wukong—bring him back.”',objective:'PROTECT TANG SANZANG — Defeat White Bone Spirit and the bewitched Zhu Bajie.',formationHint:'FORMATION — Sun Wukong, Sha Wujing, and mounted Tang Sanzang face Zhu Bajie and the bone court.',battleHint:'RESCUE BATTLE — Break Zhu Bajie’s spell, then all four pilgrims still receive a choice.',deploy:true,journeyBattle:true,bewitchedCompanions:true,protectTang:true,rewardOwners:JOURNEY_REWARD_OWNERS,enemies:[['bonespirit',0,-3],['bajie',-2,-1],['boneguard',2,-3]]},
  {id:'hooded-echo',chapter:'ACT II · JOURNEY 04',title:'The Hooded Stranger',speaker:'A Hooded Stranger',story:'“A black hood waits ahead. Beneath it, a staff follows the road Sun Wukong refused.”',objective:'PROTECT — Drive the Hooded Stranger to 25% HP while Tang Sanzang survives.',formationHint:'FORMATION — Keep the inherited party layout or rearrange all four pilgrims on the lower field.',battleHint:'PARTY GROWTH 4/6 — The stranger uses Sun Wukong’s rejected skills and escapes at 25% HP.',deploy:true,journeyBattle:true,mysteryRetreat:true,rewardOwners:JOURNEY_REWARD_OWNERS,enemies:[['mysterywukong',0,-3]]},
  {id:'fire-cloud',chapter:'ACT II · JOURNEY 05',title:'Fire Cloud Ravine',speaker:'Sha Wujing (沙悟净)',story:'“To keep walking is not the same as never changing.”',objective:'PRIMARY — Defeat every enemy. PILGRIMAGE — Tang Sanzang must survive.',formationHint:'FORMATION — Spread against line fire without leaving mounted Tang Sanzang outside protection zones.',battleHint:'PARTY GROWTH 5/6 — Defeat all enemies while protecting mounted Tang Sanzang.',deploy:true,journeyBattle:true,rewardOwners:JOURNEY_REWARD_OWNERS,enemies:[['redboy',0,-3],['fireimp',-2,-1],['fireimp',-1,-2],['fireimp',1,-2],['fireimp',2,-3]]},
  {id:'bull-demon-gate',chapter:'ACT II · JOURNEY 06',title:"The Bull Demon King's Gate",speaker:'Bull Demon King (牛魔王)',story:'“You crossed my son’s fire. Now try to cross my mountain.”',objective:'PRIMARY — Defeat every enemy. PILGRIMAGE — Tang Sanzang must survive.',formationHint:'FORMATION — Three Cloud-Horn Raiders will descend directly onto the last row.',battleHint:'PARTY GROWTH 6/6 — Hold the rear against the raiders, then break the Bull Demon King.',deploy:true,journeyBattle:true,rewardOwners:JOURNEY_REWARD_OWNERS,enemies:[['bulldemon',0,-3],['bullguard',-2,-1],['bullguard',2,-3],['skyhorn',-1,-2],['skyhorn',1,-2],['skyhorn',0,-1]]},
  {id:'bandits',chapter:'CHAPTER I',title:'The Mountain Cutthroats',speaker:'Tang Sanzang (唐三藏)',story:'“Strength ends danger. It does not decide what strength means.”',objective:'WIN — Defeat all 6 bandits.',formationHint:'DRAG SUN WUKONG onto any glowing lower Hex. Then press BEGIN BATTLE.',battleHint:'AUTO — Sun Wukong moves and attacks. Win when every bandit falls.',deploy:true,enemies:[['leader',0,-2],['sword',-1,-1],['sword',0,-1],['sword',1,-2],['archer',-2,-1],['archer',2,-3]]},
  {id:'false-party',chapter:'CHAPTER II',title:'The Echo Pilgrimage',speaker:'Tang Sanzang (唐三藏)',story:'“Wukong… why are you standing against us?”',objective:'SURVIVE — Hold for 12 seconds. Defeat advances the story.',formationHint:'DRAG ZHU BAJIE, SHA WUJING, and TANG SANZANG anywhere on the glowing lower half.',battleHint:'STORY BATTLE — Survive until the 12-second retreat. Enemy Active skills remain concealed in this first reveal.',deploy:true,suppressEnemyActives:true,enemies:[['falsewukong',0,-2],['falsebajie',-1,-2],['falsewujing',1,-2],['falsetang',0,-3],['monkey',-2,-1],['monkey',2,-3]]},
  {id:'duel',chapter:'CHAPTER III',title:'Two Wukongs',speaker:'Sun Wukong (孙悟空)',story:'“My face. My staff. But whose mind?”',objective:'REVEAL — Fight until the discarded Trait appears.',formationHint:'FORMATION — Drag the known Sun Wukong anywhere on the glowing lower half.',battleHint:'STORY DUEL — Position changes the opening distance; the battle stops when the abandoned instinct reveals itself.',deploy:true,enemies:[['falsewukong',0,-2]]},
  {id:'guanyin',chapter:'CHAPTER IV',title:"Guanyin's Test",speaker:'Guanyin (观音)',story:'“If the spell finds the imitation, the pain will tell.”',objective:'WITNESS — Endure one sustained Tight-Fillet Chant. Both Sun Wukongs are tested together.',formationHint:'DRAG SUN WUKONG within the glowing lower half. Guanyin cannot be attacked.',battleHint:'TEST — Guanyin binds both Sun Wukongs, drains them slowly, then stops when their pain proves identical.',deploy:true,enemies:[['falsewukong',0,-2]]},
  {id:'empty-seat',chapter:'CHAPTER V',title:'The Counterfeit Water Curtain',speaker:'Guanyin (观音)',story:'“An imitation pilgrimage has built itself a birthplace.”',objective:'WIN — Destroy the counterfeit Water Curtain and every echo disciple. Tang Sanzang must survive.',formationHint:'DRAG TANG SANZANG, ZHU BAJIE, SHA WUJING, and the visiting GUANYIN anywhere on the glowing lower half.',battleHint:'SPAWNER BATTLE — The Cave creates 2 Cave-Born Mimics every other turn until destroyed. Guanyin fights as a temporary ally.',deploy:true,partyBattle:true,guanyinGuest:true,choiceAfter:true,enemies:[['watercurtain',0,-3],['falsebajie',-2,-1],['falsewujing',1,-2],['falsetang',2,-3]]},
  {id:'heaven',chapter:'CHAPTER VI',title:"Under Heaven's Mirror",speaker:'Heavenly Court (天庭)',story:'“No one leaves until the mirror gives judgment.”',objective:'END — Endure the mirror for 14 seconds, or until one Sun Wukong falls.',formationHint:'DRAG SUN WUKONG inside the ring. The 18 Heavenly Soldiers block its outer Hexes.',battleHint:'TEST — The soldiers cannot be attacked. Death or 14 seconds ends the test.',deploy:true,enemies:[['falsewukong',0,-2]]},
  {id:'diting',chapter:'CHAPTER VII',title:'Diting Knows',speaker:'Diting (谛听)',story:'“I can hear what eyes cannot see.”',objective:'PROTECT — Keep Diting alive for 25 seconds.',formationHint:'DRAG SUN WUKONG, ZHU BAJIE, and SHA WUJING. Diting is fixed; Ox-Head and Horse-Face begin beside the Six-Eared Macaque.',battleHint:'PROTECT — 2 opening Wardens and waves of 3, 4, and 5 hunt Diting first. Everyone can die.',deploy:true,enemies:[['falsewukong',0,-2]]},
  {id:'unchosen',chapter:'CHAPTER VIII',title:'The Unchosen',speaker:'Sun Wukong (孙悟空)',story:'“No witness. No mirror. Only the roads we made.”',objective:'WIN — Defeat the complete echo pilgrimage.',formationHint:'DRAG all 4 pilgrims anywhere on the glowing lower half. Your history is locked.',battleHint:'FINAL BATTLE — Chosen Traits fight Discarded Traits. Last pilgrimage standing wins.',deploy:true,enemies:[['falsewukong',0,-2],['falsebajie',-1,-2],['falsewujing',1,-2],['falsetang',0,-3]]}
];

function generateHexes(radius=RADIUS){
  const cells=[];
  for(let q=-radius;q<=radius;q+=1){for(let r=-radius;r<=radius;r+=1){const s=-q-r;if(Math.max(Math.abs(q),Math.abs(r),Math.abs(s))<=radius)cells.push({q,r});}}
  return cells;
}
function hexKey(cell){return `${cell.q},${cell.r}`;}
function hexDistance(a,b){return (Math.abs(a.q-b.q)+Math.abs(a.r-b.r)+Math.abs((-a.q-a.r)-(-b.q-b.r)))/2;}
function sameHex(a,b){return a.q===b.q&&a.r===b.r;}
function isValidHex(cell){return Math.max(Math.abs(cell.q),Math.abs(cell.r),Math.abs(-cell.q-cell.r))<=RADIUS;}
function isDeploymentHex(cell){return DEPLOYMENT_HEXES.some(spot=>sameHex(spot,cell));}
function deploymentCellsForBattle(battle){return battle.deploy?generateHexes().filter(cell=>cell.r>=1&&(battle.id!=='heaven'||hexRadius(cell)<3)):[];}
function placeUnit(units,unitId,cell,allowed){
  if(!allowed.some(spot=>sameHex(spot,cell)))return {moved:false,swapped:false};
  const mover=units.find(unit=>unit.id===unitId&&unit.team==='player'&&!unit.dead);if(!mover)return {moved:false,swapped:false};
  const occupant=units.find(unit=>unit.id!==unitId&&unit.team==='player'&&!unit.dead&&sameHex(unit,cell));
  const origin={q:mover.q,r:mover.r};mover.q=cell.q;mover.r=cell.r;
  if(occupant){occupant.q=origin.q;occupant.r=origin.r;}
  return {moved:true,swapped:Boolean(occupant),occupantId:occupant?.id||null};
}

function emptyPartyChoices(){return Object.fromEntries(Object.keys(PARTY_SKILLS).map(owner=>[owner,{chosen:[],discarded:[],seen:[]}]))}
const DEFAULT_PARTY_FORMATION={'true-wukong':{q:0,r:2},'true-bajie':{q:-1,r:2},'true-wujing':{q:1,r:1},'true-tang':{q:0,r:3}};
function emptyPartyFormation(){return Object.fromEntries(Object.entries(DEFAULT_PARTY_FORMATION).map(([id,cell])=>[id,{...cell}]))}
function emptyJourneyStats(){return {clearedBattleIds:[],defeatedEnemyIds:[],foesDefeated:0,minionsDefeated:0,elitesDefeated:0,failures:0,lastFall:null};}
function mountainVariant(random=Math.random){return 1+Math.floor(random()*3);}
function createRunState(){return {scene:0,phase:'formation',deploy:{q:0,r:2},partyFormation:emptyPartyFormation(),hairDecoyFormation:{},chosenTraits:[],discardedTraits:[],seenTraits:[],partyChoices:emptyPartyChoices(),activeSkillsUsed:{chosen:[],discarded:[]},pagodaDecoys:false,mountainVariant:mountainVariant(),journeyStats:emptyJourneyStats(),chronicle:['A stone on Mount Huaguo begins to breathe.'],units:[],round:0,traitReveal:null,sixEaredColorRevealed:false,locked:false,waterHexes:[],dangerousHexes:[],radiantHexes:[],burningHexes:[],blockedHexes:[]};}
function partyPosition(run,id,fallback=DEFAULT_PARTY_FORMATION[id]){const cell=run.partyFormation?.[id]||fallback;return cell&&isValidHex(cell)&&cell.r>=1?{...cell}:{...fallback};}
function rememberPartyFormation(run,units){for(const unit of units){if(unit.team!=='player'||!DEFAULT_PARTY_FORMATION[unit.id]||unit.dead||unit.r<1)continue;run.partyFormation[unit.id]={q:unit.q,r:unit.r};}const wukong=run.partyFormation['true-wukong'];if(wukong)run.deploy={...wukong};return run.partyFormation;}
function chooseTrait(run,chosenId,rejectedId){
  if(!TRAITS[chosenId]||!TRAITS[rejectedId]||chosenId===rejectedId||run.seenTraits.includes(chosenId)||run.seenTraits.includes(rejectedId))return false;
  run.chosenTraits.push(chosenId);run.discardedTraits.push(rejectedId);run.seenTraits.push(chosenId,rejectedId);return true;
}
function makeUnit(type,id,team,q,r,traits=[]){
  const d=UNIT_DEFINITIONS[type],unit={id,type,team,q,r,name:d.name,cn:d.cn,kind:d.kind,maxHp:d.hp,hp:d.hp,atk:d.atk,range:d.range,speed:d.speed,skill:d.skill,skillCopy:d.skillCopy,traits:[...traits],techniques:[],partySkills:[],activeFrozenUntil:0,goldenUntil:0,mythic:false,attacks:0,turns:0,hits:0,dead:false,specialTarget:null,vigilanceUsed:false,adamantUsed:false,shieldUsed:false,specialUsed:false,openingUsed:false,specialCount:0,ward:type==='erlang'?3:type==='blackbear'?2:type==='boneguard'?1:0,disrupted:0,authority:team==='authority',fixed:false,moved:false,chargeReady:false,exposed:false};
  if(type==='underworld'){
    const serial=[...id].reduce((sum,char)=>sum+char.charCodeAt(0),0),oxHead=serial%2===0;
    unit.underworldVariant=oxHead?'ox':'horse';
    unit.displayName=oxHead?'Ox-Head':'Horse-Face';
    unit.cn=oxHead?'牛头':'马面';
  }
  return unit;
}
function partyOwnerForUnit(unit){if(unit.type.includes('wukong')||unit.type==='hairclone')return 'wukong';if(unit.type.includes('bajie'))return 'bajie';if(unit.type.includes('wujing'))return 'wujing';if(unit.type.includes('tang'))return 'tang';return null;}
function applyPartyBuild(unit,run,history='chosen'){
  const owner=partyOwnerForUnit(unit),skills=owner?run.partyChoices?.[owner]?.[history]||[]:[];unit.partySkills=[...skills];
  if(owner==='wukong'){
    unit.techniques=skills.filter(id=>['focusedstaff','ruyithrow'].includes(id));
    unit.speed=2;unit.range=skills.includes('longstaff')?2:1;
    for(const trait of ['sweep','somersault','cloudstaff','adamant'])if(skills.includes(trait)&&!unit.traits.includes(trait))unit.traits.push(trait);
  }
  if(owner==='bajie'&&skills.includes('longrake'))unit.range=2;
  return unit;
}
function buildFalseWukong(run,traits=run.discardedTraits){return applyPartyBuild(makeUnit('falsewukong','false-wukong','enemy',0,-2,traits),run,'discarded');}
function partySkillPairFor(run,owner,random=Math.random){
  const history=run.partyChoices?.[owner],pool=PARTY_SKILLS[owner]?.options;if(!history||!pool)return [];
  const remaining=pool.map(skill=>skill.id).filter(id=>!history.seen.includes(id));
  for(let index=remaining.length-1;index>0;index-=1){const swap=Math.floor(random()*(index+1));[remaining[index],remaining[swap]]=[remaining[swap],remaining[index]];}
  return remaining.slice(0,2);
}
function choosePartySkill(run,owner,chosenId,rejectedId){
  const history=run.partyChoices?.[owner],pool=PARTY_SKILLS[owner]?.options.map(skill=>skill.id)||[];
  if(!history||!pool.includes(chosenId)||!pool.includes(rejectedId)||chosenId===rejectedId||history.seen.includes(chosenId)||history.seen.includes(rejectedId))return false;
  history.chosen.push(chosenId);history.discarded.push(rejectedId);history.seen.push(chosenId,rejectedId);return true;
}
function applyOpeningPartySkills(units){
  for(const owner of units.filter(unit=>!unit.dead&&['bajie','wujing','tang'].includes(partyOwnerForUnit(unit)))){
    const allies=units.filter(ally=>ally.team===owner.team&&ally.id!==owner.id&&!ally.dead),adjacent=allies.filter(ally=>hexDistance(owner,ally)<=1);
    if(owner.partySkills.includes('thickhide')&&adjacent.length>=2)owner.ward=Math.max(1,owner.ward);
    if(owner.partySkills.includes('shieldring'))adjacent.forEach(ally=>{ally.ward=Math.max(1,ally.ward);});
    if(owner.partySkills.includes('bodyguard')){const tang=adjacent.find(ally=>partyOwnerForUnit(ally)==='tang');if(tang)tang.ward=Math.max(1,tang.ward);}
    if(owner.partySkills.includes('blessing')){const direction=owner.team==='player'?-1:1,ahead=allies.filter(ally=>(ally.r-owner.r)*direction>0).sort((a,b)=>hexDistance(owner,a)-hexDistance(owner,b))[0];if(ahead)ahead.ward=Math.max(1,ahead.ward);}
  }
  return units;
}
function rememberHairDecoyFormation(run,units){if(!run)return;run.hairDecoyFormation={...(run.hairDecoyFormation||{}),...Object.fromEntries(units.filter(unit=>unit.team==='player'&&unit.type==='hairdecoy'&&!unit.dead).map(unit=>[unit.id,{q:unit.q,r:unit.r}]))};}
function addOpeningTraitUnits(units,run=null){
  const occupied=new Set(units.map(hexKey)),summons=[];
  const owners=units.filter(unit=>unit.type.includes('wukong'));
  for(const owner of owners.filter(unit=>unit.traits.includes('hairclone'))){
    const cell=NEIGHBORS.map(delta=>({q:owner.q+delta.q,r:owner.r+delta.r})).find(spot=>isValidHex(spot)&&!occupied.has(hexKey(spot)));
    if(cell){
      const clone=makeUnit('hairclone',`${owner.id}-hair-clone`,owner.team,cell.q,cell.r,owner.traits);clone.kind=`${owner.kind} hair-clone spectral-copy`;
      clone.atk=owner.atk;clone.range=owner.range;clone.speed=owner.speed;clone.skill=owner.skill;clone.skillCopy=`Fragile copy: ${owner.skillCopy}`;clone.techniques=[...owner.techniques];clone.partySkills=[...owner.partySkills];clone.mythic=owner.mythic;clone.cloneOf=owner.id;
      summons.push(clone);occupied.add(hexKey(cell));
    }
  }
  for(const owner of owners.filter(unit=>unit.traits.includes('hairdecoy'))){
    const candidates=[...NEIGHBORS.map(delta=>({q:owner.q+delta.q,r:owner.r+delta.r})),...generateHexes().sort((a,b)=>hexDistance(owner,a)-hexDistance(owner,b)||a.r-b.r||a.q-b.q)];
    for(let index=0;index<4;index+=1){
      const id=`${owner.id}-hair-decoy-${index+1}`,saved=owner.team==='player'?run?.hairDecoyFormation?.[id]:null;
      const cell=[saved,...candidates].find(spot=>spot&&isValidHex(spot)&&!occupied.has(hexKey(spot)));if(!cell)break;
      const decoy=makeUnit('hairdecoy',id,owner.team,cell.q,cell.r,[]);decoy.kind=`${owner.kind} hair-decoy spectral-copy diminished-copy`;decoy.displayName='Plucked-Hair Decoy';decoy.summonerId=owner.id;decoy.summonerTraits=[...owner.traits];
      summons.push(decoy);occupied.add(hexKey(cell));
    }
  }
  const result=[...units,...summons];rememberHairDecoyFormation(run,result);return result;
}
function mythicTraitsFor(run){const traits=['sweep','cloudstaff','somersault','hairclone','twinstrike','splitstaff','returning'];if(run.pagodaDecoys)traits.push('hairdecoy');return traits;}
function makeMythicWukong(run){const hero=makeUnit('wukong','true-wukong','player',run.deploy.q,run.deploy.r,mythicTraitsFor(run));hero.mythic=true;hero.kind+=' great-sage';hero.displayName='Great Sage (齐天大圣)';hero.techniques=[...MYTHIC_TECHNIQUES];return hero;}
function createBattleUnits(run,battle=BATTLES[run.scene]){
  run.burningHexes=[];
  if(battle.id==='stone-birth'){const stone=makeUnit('wukong','true-wukong','player',0,0);stone.kind='stone-egg';stone.displayName='Stone Egg';stone.skill='Unborn';stone.skillCopy='Wind, cloud, and ink wait inside.';return [stone];}
  if(battle.mythic){
    const hero=makeMythicWukong(run);
    const enemies=battle.enemies.map(([type,q,r],index)=>makeUnit(type,`${battle.id}-${type}-${index}`,'enemy',q,r));
    return addOpeningTraitUnits([hero,...enemies],run);
  }
  if(battle.id==='buddha-palm'){const hero=makeMythicWukong(run);if(hexRadius(hero)!==RADIUS){hero.q=0;hero.r=RADIUS;}return addOpeningTraitUnits([hero,makeUnit('buddha','buddha','authority',0,-3)],run);}
  if(battle.id==='mountain-opens'){const hero=makeUnit('wukong','true-wukong','player',0,0);hero.kind='wukong sealed';hero.displayName='Sun Wukong · Sealed';return [hero,makeUnit('tang','true-tang','player',0,2)];}
  if(battle.journeyBattle){
    const wukongCell=partyPosition(run,'true-wukong'),bajieCell=partyPosition(run,'true-bajie'),wujingCell=partyPosition(run,'true-wujing'),tangCell=partyPosition(run,'true-tang');
    const hero=applyPartyBuild(makeUnit('wukong','true-wukong','player',wukongCell.q,wukongCell.r),run);
    hero.skill='Pilgrim-Built Staff';hero.skillCopy=hero.partySkills.length?`Chosen on the road: ${hero.partySkills.map(id=>PARTY_SKILL_LOOKUP[id].name).join(' · ')}`:'Only a basic adjacent staff attack remains.';
    const tang=applyPartyBuild(makeUnit('tang','true-tang','player',tangCell.q,tangCell.r),run);
    const fullParty=[hero,applyPartyBuild(makeUnit('bajie','true-bajie','player',bajieCell.q,bajieCell.r),run),applyPartyBuild(makeUnit('wujing','true-wujing','player',wujingCell.q,wujingCell.r),run),tang];
    const party=battle.bewitchedCompanions?[hero,fullParty[2],tang]:fullParty;
    const enemies=battle.enemies.map(([type,q,r],index)=>{
      const unit=applyPartyBuild(makeUnit(type,`${battle.id}-${type}-${index}`,'enemy',q,r),run,type==='mysterywukong'?'discarded':'chosen');
      if(type==='mysterywukong'){
        unit.displayName='Hooded Stranger';
        unit.skill='Borrowed Road';
        unit.skillCopy=unit.partySkills.length?`UNCHOSEN — ${unit.partySkills.map(id=>PARTY_SKILL_LOOKUP[id].name).join(' · ')}`:'UNCHOSEN — No rejected technique has taken shape yet.';
      }
      if(battle.bewitchedCompanions&&type==='bajie'){unit.displayName=`Bewitched ${unit.name}`;unit.kind+=` bewitched-${type}`;}
      return unit;
    });
    return applyOpeningPartySkills(addOpeningTraitUnits([...party,...enemies],run));
  }
  if(battle.id==='false-party'){
    const bajieCell=partyPosition(run,'true-bajie'),wujingCell=partyPosition(run,'true-wujing'),tangCell=partyPosition(run,'true-tang');
    const party=[applyPartyBuild(makeUnit('bajie','true-bajie','player',bajieCell.q,bajieCell.r),run),applyPartyBuild(makeUnit('wujing','true-wujing','player',wujingCell.q,wujingCell.r),run),applyPartyBuild(makeUnit('tang','true-tang','player',tangCell.q,tangCell.r),run)];
    const enemies=battle.enemies.map(([type,q,r],i)=>{
      const unit=type==='falsewukong'?buildFalseWukong(run,run.discardedTraits.slice(0,1)):applyPartyBuild(makeUnit(type,`false-${type}-${i}`,'enemy',q,r),run,'discarded');
      unit.hidden=type!=='falsewukong';
      return unit;
    });
    return applyOpeningPartySkills(addOpeningTraitUnits([...party,...enemies],run));
  }
  if(battle.id==='diting'){
    const wukongCell=partyPosition(run,'true-wukong'),bajieCell=partyPosition(run,'true-bajie'),wujingCell=partyPosition(run,'true-wujing');
    const party=[applyPartyBuild(makeUnit('wukong','true-wukong','player',wukongCell.q,wukongCell.r,run.chosenTraits),run),applyPartyBuild(makeUnit('bajie','true-bajie','player',bajieCell.q,bajieCell.r),run),applyPartyBuild(makeUnit('wujing','true-wujing','player',wujingCell.q,wujingCell.r),run),makeUnit('diting','diting','player',0,0)];
    party[3].fixed=true;
    const falseOne=buildFalseWukong(run);
    const openingGuards=DITING_OPENING_GUARDS.map((cell,index)=>makeUnit('underworld',`underworld-opening-${index+1}`,'enemy',cell.q,cell.r));
    return addOpeningTraitUnits([...party,falseOne,...openingGuards],run);
  }
  if(battle.partyBattle){
    const bajieCell=partyPosition(run,'true-bajie'),wujingCell=partyPosition(run,'true-wujing'),tangCell=partyPosition(run,'true-tang');
    const party=[applyPartyBuild(makeUnit('bajie','true-bajie','player',bajieCell.q,bajieCell.r),run),applyPartyBuild(makeUnit('wujing','true-wujing','player',wujingCell.q,wujingCell.r),run),applyPartyBuild(makeUnit('tang','true-tang','player',tangCell.q,tangCell.r),run)];
    if(battle.guanyinGuest){const occupied=new Set(party.map(hexKey)),cell=PARTY_DEPLOYMENT_HEXES.find(spot=>!occupied.has(hexKey(spot)))||{q:2,r:1};party.push(makeUnit('guanyin','visiting-guanyin','player',cell.q,cell.r));}
    const enemies=battle.enemies.map(([type,q,r],index)=>applyPartyBuild(makeUnit(type,`mirror-${type}-${index}`,'enemy',q,r),run,'discarded'));
    return applyOpeningPartySkills([...party,...enemies]);
  }
  if(battle.id==='unchosen'){
    const wukongCell=partyPosition(run,'true-wukong'),bajieCell=partyPosition(run,'true-bajie'),wujingCell=partyPosition(run,'true-wujing'),tangCell=partyPosition(run,'true-tang');
    const party=[applyPartyBuild(makeUnit('wukong','true-wukong','player',wukongCell.q,wukongCell.r,run.chosenTraits),run),applyPartyBuild(makeUnit('bajie','true-bajie','player',bajieCell.q,bajieCell.r),run),applyPartyBuild(makeUnit('wujing','true-wujing','player',wujingCell.q,wujingCell.r),run),applyPartyBuild(makeUnit('tang','true-tang','player',tangCell.q,tangCell.r),run)];
    const enemies=battle.enemies.map(([type,q,r],index)=>type==='falsewukong'?buildFalseWukong(run):applyPartyBuild(makeUnit(type,`final-${type}-${index}`,'enemy',q,r),run,'discarded'));
    return applyOpeningPartySkills(addOpeningTraitUnits([...party,...enemies],run));
  }
  const hero=applyPartyBuild(makeUnit('wukong','true-wukong','player',run.deploy.q,run.deploy.r,run.chosenTraits),run);
  const enemies=battle.enemies.map(([type,q,r],i)=>type==='falsewukong'?buildFalseWukong(run):makeUnit(type,`${type}-${i}`,'enemy',q,r));
  if(battle.id==='duel'&&run.discardedTraits[0]==='killing')enemies.push(makeUnit('decoy','ink-decoy','player',0,0));
  if(battle.id==='guanyin'){const witness=makeUnit('guanyin','guanyin','authority',0,-3);witness.kind+=' authority';witness.hp=witness.maxHp=999;witness.atk=0;witness.range=0;witness.speed=0;witness.skill='Tight-Fillet Chant';witness.skillCopy='Binds both Wukongs, drains them equally, then stops without a verdict.';return addOpeningTraitUnits([hero,...enemies,witness],run);}
  if(battle.id==='heaven')return addOpeningTraitUnits([hero,...enemies,...generateHexes().filter(cell=>hexRadius(cell)===3).map((cell,index)=>makeUnit('heavenly',`heavenly-guard-${index+1}`,'authority',cell.q,cell.r))],run);
  return addOpeningTraitUnits([hero,...enemies],run);
}
function living(units,team){return units.filter(unit=>!unit.dead&&!unit.hidden&&unit.team===team);}
function bossRouteTarget(actor,foes){
  const tang=foes.find(unit=>partyOwnerForUnit(unit)==='tang');if(!tang)return null;const routeLength=hexDistance(actor,tang);
  return foes.filter(unit=>unit.id!==tang.id&&hexDistance(actor,unit)+hexDistance(unit,tang)===routeLength).sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b)||a.hp-b.hp||a.id.localeCompare(b.id))[0]||tang;
}
function selectTarget(actor,units){
  const foes=living(units,actor.team==='player'?'enemy':'player');if(!foes.length)return null;const ditingBattle=units.some(unit=>unit.id==='diting');
  if(actor.type==='erlang'&&(actor.attacks+1)%3===0){const trueOne=foes.find(unit=>unit.id==='true-wukong');if(trueOne)return trueOne;}
  if(actor.type==='heavenlyhound'){if(!actor.openingUsed){const decoy=foes.find(unit=>unit.type==='hairdecoy');if(decoy)return decoy;}if(actor.openingUsed&&houndPounceReady(actor)){const tang=foes.find(unit=>partyOwnerForUnit(unit)==='tang');if(tang)return tang;}const trueOne=foes.find(unit=>unit.id==='true-wukong');if(trueOne)return trueOne;}
  if(ditingBattle&&actor.id==='false-wukong'){const trueOne=foes.find(unit=>unit.id==='true-wukong');if(trueOne)return trueOne;}
  if(actor.type==='underworld'){const witness=foes.find(unit=>unit.id==='diting');if(witness)return witness;}
  if(actor.type==='skyhorn'&&!actor.openingUsed){const tang=foes.find(unit=>partyOwnerForUnit(unit)==='tang');if(tang)return tang;}
  if(ditingBattle&&actor.team==='player'){const guards=foes.filter(unit=>unit.type==='underworld');if(guards.length)return [...guards].sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b)||a.hp-b.hp||a.id.localeCompare(b.id))[0];}
  if(actor.partySkills?.includes('goldengaze')){const boss=foes.filter(unit=>unit.kind.includes('boss')).sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b))[0];if(boss)return boss;}
  if(actor.partySkills?.includes('longwatch')){const tang=living(units,actor.team).find(unit=>partyOwnerForUnit(unit)==='tang'),threat=tang&&foes.filter(unit=>hexDistance(unit,tang)<=2).sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b))[0];if(threat)return threat;}
  const marked=foes.find(unit=>unit.id===actor.specialTarget);if(marked)return marked;
  const roadblock=foes.filter(unit=>unit.partySkills?.includes('roadblock')&&hexDistance(actor,unit)<=2).sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b))[0];if(roadblock)return roadblock;
  if(actor.team==='enemy'&&actor.kind.includes('boss')){const routeTarget=bossRouteTarget(actor,foes);if(routeTarget)return routeTarget;}
  return [...foes].sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b)||a.hp-b.hp||a.id.localeCompare(b.id))[0];
}
function supportRangeFor(actor){return actor.partySkills?.includes('deepprayer')?3:2;}
function woundedAlliesFor(actor,units){return living(units,actor.team).filter(unit=>unit.id!==actor.id&&unit.hp<unit.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.hp-b.hp||a.id.localeCompare(b.id));}
function selectSupportObjective(actor,units){return woundedAlliesFor(actor,units)[0]||null;}
function selectSupportTarget(actor,units){return woundedAlliesFor(actor,units).find(unit=>hexDistance(actor,unit)<=supportRangeFor(actor))||null;}
function supportStep(actor,target,units,blocked=[]){return !target||hexDistance(actor,target)<=supportRangeFor(actor)?{q:actor.q,r:actor.r}:nextStep(actor,target,units,blocked);}
function adjacentUnits(unit,units,team=unit.team){return living(units,team).filter(other=>other.id!==unit.id&&hexDistance(unit,other)<=1);}
function formationDamageMultiplier(target,units){
  let multiplier=1;
  const allies=living(units,target.team);
  if(allies.some(unit=>partyOwnerForUnit(unit)==='wujing'&&unit.partySkills?.includes('holdformation')&&!unit.moved&&hexDistance(unit,target)<=1))multiplier*=.75;
  if(allies.some(unit=>partyOwnerForUnit(unit)==='tang'&&unit.partySkills?.includes('sanctuary')&&hexDistance(unit,target)<=2))multiplier*=.8;
  if(allies.some(unit=>unit.type==='guanyin'&&hexDistance(unit,target)<=2))multiplier*=.75;
  return multiplier;
}
function formationAttackMultiplier(actor,units){return living(units,actor.team).some(unit=>unit.type==='guanyin'&&unit.id!==actor.id&&hexDistance(unit,actor)<=2)?1.25:1;}
function usesWukongKit(actor){return actor.type.includes('wukong')||actor.type==='hairclone';}
function hasTechnique(actor,id){return usesWukongKit(actor)&&(actor.mythic||actor.techniques.includes(id));}
function ruyiThrowReady(actor){return hasTechnique(actor,'ruyithrow')&&(actor.attacks+1)%5===0;}
function sweepReady(actor){return usesWukongKit(actor)&&actor.traits.includes('sweep')&&(actor.attacks+1)%3===0;}
function focusedStrikeReady(actor){return hasTechnique(actor,'focusedstaff')&&!actor.traits.includes('sweep')&&(actor.attacks+1)%3===0;}
function pagodaMusterReady(actor){return actor.type==='lijing'&&actor.turns>0&&actor.turns%2===0;}
function erlangSpearReady(actor){return actor.type==='erlang'&&(actor.attacks+1)%4===0;}
function houndPounceReady(actor){return actor.type==='heavenlyhound'&&(actor.attacks+1)%2===0;}
function houndFlurryReady(actor){return actor.type==='heavenlyhound'&&!actor.openingUsed;}
function rakeSweepReady(actor){return actor.partySkills?.includes('rakesweep')&&(actor.attacks+1)%3===0;}
function staffLineReady(actor){return actor.partySkills?.includes('staffline')&&(actor.attacks+1)%3===0;}
function bodyFixingReady(actor){return actor.partySkills?.includes('bodyfixing')&&actor.attacks>0&&actor.attacks%4===0;}
function banishingVerseReady(actor){return actor.partySkills?.includes('banishingverse')&&actor.turns>0&&actor.turns%3===0;}
function attackRangeFor(actor){return Math.max(actor.range,actor.traits.includes('cloudstaff')?3:0,(sweepReady(actor)||rakeSweepReady(actor)||staffLineReady(actor))?2:0,ruyiThrowReady(actor)?RADIUS*2:0);}
function ruyiLineTargets(actor,target,units){
  const foes=living(units,actor.team==='player'?'enemy':'player'),targetS=-target.q-target.r;
  const main=foes.filter(unit=>unit.id===target.id||unit.q===target.q||unit.r===target.r||(-unit.q-unit.r)===targetS).sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b)||a.id.localeCompare(b.id));
  if(actor.traits.includes('splitstaff'))main.push(...foes.filter(unit=>!main.includes(unit)).sort((a,b)=>hexDistance(target,a)-hexDistance(target,b)||a.hp-b.hp).slice(0,2));
  return [...new Set(main)];
}
function nextStep(actor,target,units,blocked=[]){
  const occupied=new Set(units.filter(unit=>!unit.dead&&unit.id!==actor.id).map(hexKey));
  const blockedSet=new Set(blocked);
  return NEIGHBORS.map(delta=>({q:actor.q+delta.q,r:actor.r+delta.r})).filter(cell=>isValidHex(cell)&&!occupied.has(hexKey(cell))&&!blockedSet.has(hexKey(cell))).sort((a,b)=>hexDistance(a,target)-hexDistance(b,target)||a.r-b.r||a.q-b.q)[0]||{q:actor.q,r:actor.r};
}
function pushAwayFrom(source,target,units,steps=2,blocked=[]){
  const occupied=new Set(units.filter(unit=>!unit.dead&&unit.id!==target.id).map(hexKey)),blockedSet=new Set(blocked);let position={q:target.q,r:target.r};
  for(let index=0;index<steps;index+=1){const next=NEIGHBORS.map(delta=>({q:position.q+delta.q,r:position.r+delta.r})).filter(cell=>isValidHex(cell)&&!occupied.has(hexKey(cell))&&!blockedSet.has(hexKey(cell))&&hexDistance(source,cell)>hexDistance(source,position)).sort((a,b)=>hexDistance(source,b)-hexDistance(source,a)||a.r-b.r||a.q-b.q)[0];if(!next)break;position=next;}
  return position;
}
function tidalWavePlacements(source,targets,units){
  const targetIds=new Set(targets.map(target=>target.id)),reserved=new Set(units.filter(unit=>!unit.dead&&!targetIds.has(unit.id)).map(hexKey)),placements=[];
  for(const target of [...targets].sort((a,b)=>hexDistance(source,b)-hexDistance(source,a)||a.id.localeCompare(b.id))){
    const destination=generateHexes().filter(cell=>!reserved.has(hexKey(cell))).sort((a,b)=>hexDistance(source,b)-hexDistance(source,a)||hexRadius(b)-hexRadius(a)||a.r-b.r||a.q-b.q)[0];
    if(!destination)continue;reserved.add(hexKey(destination));placements.push({id:target.id,q:destination.q,r:destination.r});
  }
  return placements;
}
function returnToTangDestination(actor,units,blocked=[]){
  const tang=living(units,actor.team).find(unit=>partyOwnerForUnit(unit)==='tang');if(!tang||hexDistance(actor,tang)<=1)return null;
  const occupied=new Set(units.filter(unit=>!unit.dead&&unit.id!==actor.id).map(hexKey)),blockedSet=new Set(blocked);
  return NEIGHBORS.map(delta=>({q:tang.q+delta.q,r:tang.r+delta.r})).filter(cell=>isValidHex(cell)&&!occupied.has(hexKey(cell))&&!blockedSet.has(hexKey(cell))).sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b)||a.r-b.r||a.q-b.q)[0]||null;
}
function traitPairFor(run,random=Math.random){
  const remaining=TRAIT_ORDER.filter(id=>!run.seenTraits.includes(id)&&!(id==='hairdecoy'&&run.pagodaDecoys)&&(id!=='inkburst'||run.seenTraits.includes('hairdecoy')||run.pagodaDecoys));
  for(let index=remaining.length-1;index>0;index-=1){const swap=Math.floor(random()*(index+1));[remaining[index],remaining[swap]]=[remaining[swap],remaining[index]];}
  return remaining.slice(0,2);
}

let state=createRunState();
let combatTimer=null;
let storyAction=null;
let endingAction=null;
let draggingUnitId=null;
let selectedDeploymentId=null;
let hoveredAuraOwnerId=null;
const hasDOM=typeof document!=='undefined';
const $=id=>hasDOM?document.getElementById(id):null;
const wait=ms=>new Promise(resolve=>{combatTimer=setTimeout(resolve,ms);});

function positionFor(cell){return {left:`${50+(cell.q+cell.r/2)*10.8}%`,top:`${50+cell.r*11.5}%`};}
function named(unit){return `${unit.name} (${unit.cn})`;}
function setCopy(text){if($('event-copy'))$('event-copy').textContent=text;}
function addChronicle(text){state.chronicle.push(text);renderChronicle();}
function renderChronicle(){if(!$('chronicle'))return;$('chronicle').innerHTML=state.chronicle.slice(-5).map(line=>`<li>${line}</li>`).join('');}

function journeyStartIndex(){return BATTLES.findIndex(battle=>battle.id==='mountain-opens');}
function journeyHasBegun(run=state){return run.scene>=journeyStartIndex();}
function journeyActionLabel(run=state){return journeyHasBegun(run)?'ABANDON JOURNEY':'BEGIN THE JOURNEY';}
function recordBattleClear(battle,run=state){if(!journeyHasBegun(run)||run.journeyStats.clearedBattleIds.includes(battle.id))return false;run.journeyStats.clearedBattleIds.push(battle.id);return true;}
function recordBattleFailure(run=state){if(!journeyHasBegun(run))return false;run.journeyStats.failures+=1;return true;}
function recordUnitFall(target,attacker,run=state){
  if(!journeyHasBegun(run))return;
  const battle=BATTLES[run.scene];
  if(target.team==='enemy'){
    const key=`${battle.id}:${target.id}`;if(run.journeyStats.defeatedEnemyIds.includes(key))return;
    run.journeyStats.defeatedEnemyIds.push(key);run.journeyStats.foesDefeated+=1;
    if(target.kind.includes('boss'))run.journeyStats.elitesDefeated+=1;else run.journeyStats.minionsDefeated+=1;
    return;
  }
  const owner=partyOwnerForUnit(target);if(target.team==='player'&&owner&&attacker)run.journeyStats.lastFall={hero:named(target),foe:named(attacker),location:battle.title};
}
function skillNamesForReport(run,owner){
  const roadSkills=run.partyChoices[owner].chosen.map(id=>{const skill=PARTY_SKILL_LOOKUP[id];return `${skill.name} (${skill.cn})`;});
  if(owner==='wukong')roadSkills.push(...run.chosenTraits.map(id=>`${TRAITS[id].name} (${TRAITS[id].cn})`));
  return roadSkills;
}
function buildJourneyReport(run,completed=false){
  const current=BATTLES[Math.min(run.scene,BATTLES.length-1)],stats=run.journeyStats;
  if(!journeyHasBegun(run))return {title:'The road west never began.',line:'Five Elements Mountain still holds the beginning.',markup:'<div class="journey-report pre-journey"><p>Tang Sanzang had not yet freed Sun Wukong. This record closes before the pilgrimage formed—there are no westward battles to count.</p></div>'};
  const heroes=[['wukong','Sun Wukong','孙悟空'],['bajie','Zhu Bajie','猪八戒'],['wujing','Sha Wujing','沙悟净'],['tang','Tang Sanzang','唐三藏']];
  const skills=heroes.map(([owner,name,cn])=>{const chosen=skillNamesForReport(run,owner);return `<section class="journey-hero"><h3>${name} <small>${cn}</small></h3><p>${chosen.length?chosen.join(' · '):'No skill chosen yet.'}</p></section>`;}).join('');
  const fall=stats.lastFall?`${stats.lastFall.hero} fell to ${stats.lastFall.foe} at ${stats.lastFall.location}.`:`No pilgrim has fallen on this recorded road.`;
  const conclusion=completed?'Tang Sanzang, Sun Wukong, Zhu Bajie, and Sha Wujing leave this conflict behind and continue west toward the scriptures. The pilgrimage is still underway.':`This attempt ends at ${current.title}. The scriptures remain farther west; another journey can carry the pilgrims beyond this point.`;
  return {title:completed?'The road continues west.':`The journey rests at ${current.title}.`,line:completed?'One conflict ends. The pilgrimage does not.':'The road is unfinished, not forgotten.',markup:`<div class="journey-report"><div class="journey-stats"><div><strong>${stats.clearedBattleIds.length}</strong><span>Battles Cleared</span></div><div><strong>${stats.failures}</strong><span>Failures</span></div><div><strong>${stats.foesDefeated}</strong><span>Foes Defeated</span></div><div><strong>${stats.minionsDefeated}</strong><span>Minions</span></div><div><strong>${stats.elitesDefeated}</strong><span>Elite Foes</span></div></div><p class="journey-fall">${fall}</p><p class="journey-conclusion">${conclusion}</p><div class="journey-skills"><h3>Chosen Skills</h3>${skills}</div></div>`};
}

function cellsWithin(center,radius,includeCenter=false){return generateHexes().filter(cell=>(includeCenter||!sameHex(cell,center))&&hexDistance(center,cell)<=radius);}
function positionalAuraSpecs(unit,units){
  if(unit.dead||unit.hidden)return [];
  const specs=[],add=(ids,kind,symbol,effect,cells)=>{if(ids.some(id=>unit.partySkills?.includes(id)))specs.push({ownerId:unit.id,team:unit.team,kind,symbol,effect,cells,hoverOnly:false});};
  add(['shieldring','movingwall','thickhide'],'bajie','盾','shield',cellsWithin(unit,1));
  add(['guardcircle','riverstep','bodyguard'],'wujing','盾','shield',cellsWithin(unit,1));
  add(['steadyhand'],'wujing','攻','attack-buff',cellsWithin(unit,1));
  add(['sutracircle','chainprayer'],'tang','疗','heal',cellsWithin(unit,1));
  add(['stillness'],'tang','定','shield',cellsWithin(unit,1));
  add(['compassion'],'tang','慈','heal',cellsWithin(unit,2));
  add(['sanctuary'],'tang','护','shield',cellsWithin(unit,2));
  add(['deepprayer'],'tang','祷','heal',cellsWithin(unit,3));
  if(unit.type==='guanyin'&&unit.team==='player'){
    specs.push({ownerId:unit.id,team:unit.team,kind:'guanyin-lotus',symbol:'莲',effect:'attack-buff',cells:cellsWithin(unit,2)});
    specs.push({ownerId:unit.id,team:unit.team,kind:'guanyin-lotus',symbol:'莲',effect:'shield',cells:cellsWithin(unit,2)});
  }
  if(unit.partySkills.includes('blessing')){const direction=unit.team==='player'?-1:1;specs.push({ownerId:unit.id,team:unit.team,kind:'tang',symbol:'愿',effect:'shield',cells:NEIGHBORS.map(delta=>({q:unit.q+delta.q,r:unit.r+delta.r})).filter(cell=>isValidHex(cell)&&deltaDirection(unit,cell)===direction)});}
  return specs;
}
function deltaDirection(origin,cell){return Math.sign(cell.r-origin.r);}
function auraMapForUnits(units,focusId=null){
  const map=new Map();
  const visibleSpecs=units.flatMap(unit=>positionalAuraSpecs(unit,units)).filter(spec=>focusId?spec.ownerId===focusId:spec.team==='player');
  visibleSpecs.forEach(spec=>spec.cells.forEach(cell=>{const key=hexKey(cell),entry=map.get(key)||{kinds:new Set(),symbols:new Set(),effects:new Set(),teams:new Set(),focused:false};entry.kinds.add(spec.kind);entry.symbols.add(spec.symbol);entry.effects.add(spec.effect);entry.teams.add(spec.team);entry.focused=entry.focused||spec.ownerId===focusId;map.set(key,entry);}));
  return map;
}
const AURA_EFFECT_ORDER=['heal','shield','attack-buff'];
function visibleAuraEffects(aura){return AURA_EFFECT_ORDER.filter(effect=>aura.effects.has(effect));}
function primaryAuraEffect(aura){return visibleAuraEffects(aura)[0]||'shield';}
function auraEffectMarkup(aura){return visibleAuraEffects(aura).map(effect=>`<i class="aura-token aura-token-${effect}" title="${effect}" aria-hidden="true"></i>`).join('');}

function renderHexes(){
  if(!$('hex-layer'))return;
  const battle=BATTLES[state.scene],allowed=deploymentCellsForBattle(battle),auras=auraMapForUnits(state.units,hoveredAuraOwnerId);
  $('hex-layer').innerHTML=generateHexes().map(cell=>{const pos=positionFor(cell);const zone=cell.r<=-1?'enemy-zone':cell.r>=1?'player-zone':'center-zone';const deploy=state.phase==='formation'&&battle.deploy&&allowed.some(spot=>sameHex(spot,cell))?' deployable':'';const key=hexKey(cell),terrain=state.blockedHexes.includes(key)?' unavailable':state.burningHexes.includes(key)?' burning':state.dangerousHexes.includes(key)?' dangerous':state.radiantHexes.includes(key)?' radiant':state.waterHexes.includes(key)?' purifying-water':'',aura=auras.get(key),effects=aura?visibleAuraEffects(aura):[],effect=effects[0]||'',symbols=aura?[...aura.symbols].slice(0,3).join(''):'',auraClass=aura?` aura-cell aura-effect-${effect} ${effects.map(value=>`aura-has-${value}`).join(' ')} ${[...aura.kinds].map(kind=>`aura-${kind}`).join(' ')} ${aura.teams.has('player')?'aura-friendly':''} ${aura.teams.has('enemy')?'aura-hostile':''} ${aura.focused?'aura-focused':''}`:'';return `<button class="hex ${zone}${deploy}${terrain}${auraClass}" style="left:${pos.left};top:${pos.top}" data-q="${cell.q}" data-r="${cell.r}" data-aura="${symbols}" data-effect="${effects.join(' ')}" aria-label="Hex ${cell.q}, ${cell.r}${state.burningHexes.includes(key)?' · burning':''}${symbols?` · ${effects.join(', ')} zones ${symbols}`:''}">${aura?`<span class="aura-stack">${auraEffectMarkup(aura)}</span>`:''}</button>`;}).join('');
  document.querySelectorAll('.hex.deployable').forEach(hex=>{
    hex.onclick=()=>moveDeployment(Number(hex.dataset.q),Number(hex.dataset.r),selectedDeploymentId);
    hex.ondragover=event=>{event.preventDefault();hex.classList.add('drop-ready');};
    hex.ondragleave=()=>hex.classList.remove('drop-ready');
    hex.ondrop=event=>{event.preventDefault();moveDeployment(Number(hex.dataset.q),Number(hex.dataset.r),draggingUnitId);};
  });
}
function horseSvgMarkup(){return `<svg class="white-dragon-horse" viewBox="0 0 150 96" aria-hidden="true" focusable="false">
  <path class="horse-tail" d="M24 58C10 52 8 66 2 70C11 70 18 67 25 63"/>
  <path class="horse-back-leg" d="M36 68C35 76 33 84 35 92L43 92C44 84 47 76 48 69"/>
  <path class="horse-back-leg far" d="M57 70C57 78 56 85 59 93L67 93C66 84 69 77 70 69"/>
  <path class="horse-front-leg far" d="M92 67C94 75 94 84 97 92L105 92C102 82 105 73 104 64"/>
  <path class="horse-body" d="M21 50C36 42 69 42 91 48C102 51 108 59 104 67C98 75 78 77 57 76C38 76 20 72 17 63C15 58 16 54 21 50Z"/>
  <path class="horse-neck" d="M88 57C94 48 98 33 101 22C104 13 113 12 119 19C123 25 118 34 113 42C108 51 107 59 105 65Z"/>
  <path class="horse-head" d="M105 18C110 10 121 7 130 12C136 15 139 21 136 26C132 31 123 30 117 28L108 26Z"/>
  <path class="horse-muzzle" d="M128 19C138 18 146 22 147 27C145 33 135 34 128 30Z"/>
  <path class="horse-ear" d="M110 13L108 1C115 3 118 8 118 13M124 12L128 1C132 7 131 11 130 15"/>
  <path class="horse-mane" d="M104 19C100 29 101 42 94 54"/>
  <path class="horse-front-leg" d="M105 63C108 72 108 82 111 93L120 93C116 81 120 70 117 58"/>
  <path class="horse-bridle" d="M110 17C119 22 130 22 138 24M117 14C115 22 116 29 120 34"/>
  <circle class="horse-eye" cx="127" cy="17" r="2"/>
  <path class="saddle-cloth" d="M43 43L83 44L88 66L38 65Z"/>
  <path class="saddle" d="M45 42C54 36 72 36 81 43L78 49L48 49Z"/>
  <path class="reins" d="M76 43C94 36 111 27 130 27"/>
</svg>`;}
function journeyEnemySvgMarkup(unit){
  const token=unit.kind.includes('bandit boss')?'bandit-boss':unit.kind.includes('bandit archer')?'bandit-archer':['bandit','monkey-soldier','black-bear','wolf-spirit','yellow-wind','windling','bone-spirit','bone-guard','red-boy','fire-imp','bull-demon','bull-guard','sky-horn','hooded-stranger'].find(name=>unit.kind.includes(name));
  if(!token)return '';
  const art={
    'bandit-boss':`<path class="leader-coat" d="M14 42Q18 29 31 25H53Q68 31 73 45L68 82H12Z"/><path class="fur-collar" d="M21 36Q39 24 61 36L54 47Q40 39 26 48Z"/><circle class="bandit-face" cx="42" cy="20" r="14"/><path class="head-wrap" d="M27 17Q42 4 57 17L55 24Q40 17 28 24Z M54 15L72 9L61 25Z"/><path class="leader-sash" d="M16 55Q42 45 70 57"/><path class="heavy-saber" d="M68 18Q85 27 78 60L72 80M67 18L76 13L81 20L72 25Z"/><path class="saber-edge" d="M78 27Q87 43 78 60"/><path class="boot" d="M22 79L19 89H36M55 79L61 89H75"/>`,
    'bandit-archer':`<path class="archer-tunic" d="M23 37Q40 28 57 38L61 77H17Z"/><circle class="bandit-face" cx="40" cy="22" r="13"/><path class="archer-hood" d="M23 20Q26 5 41 6Q57 7 60 22L52 20Q39 13 27 24Z"/><path class="quiver" d="M16 31L9 73M7 31L16 31M9 29L6 18M13 29L13 16M17 30L20 20"/><path class="curved-bow" d="M67 13Q82 42 66 75M67 13L66 75"/><path class="drawn-arrow" d="M37 45L74 40M69 36L75 40L69 44"/><path class="boot" d="M25 75L22 88H36M49 75L55 88H69"/>`,
    bandit:`<path class="swordsman-tunic" d="M20 38Q40 28 59 39L64 77H16Z"/><circle class="bandit-face" cx="40" cy="22" r="13"/><path class="head-wrap" d="M25 18Q41 7 56 18L54 25Q40 18 26 24Z M54 16L68 13L59 27Z"/><path class="arm-wrap" d="M18 44L8 61M59 43L69 57"/><path class="short-saber" d="M65 31Q78 36 79 49Q75 62 60 70L56 63Q68 53 69 43Q67 38 61 36Z"/><path class="saber-edge" d="M72 35Q83 49 61 68"/><path class="boot" d="M25 75L18 88H34M51 75L58 88H74"/>`,
    'monkey-soldier':`<path class="monkey-tail" d="M20 59Q2 64 7 44Q10 33 19 39"/><path class="monkey-legs" d="M25 68L19 87M50 68L59 87"/><path class="monkey-tunic" d="M20 38Q39 28 57 40L61 72Q39 81 16 70Z"/><circle class="monkey-head" cx="39" cy="23" r="15"/><circle class="monkey-ear" cx="24" cy="23" r="7"/><circle class="monkey-ear" cx="54" cy="23" r="7"/><ellipse class="monkey-muzzle" cx="40" cy="28" rx="10" ry="7"/><path class="rope-harness" d="M21 45L57 65M57 44L23 66"/><path class="rough-staff" d="M70 8L65 86"/><path class="staff-wrap" d="M65 24L72 24M63 30L70 30"/>`,
    'black-bear':`<path class="silhouette robe" d="M20 40Q13 56 15 82H65Q67 56 59 40L51 30H28Z"/><circle class="fur" cx="40" cy="25" r="18"/><circle class="ear" cx="25" cy="13" r="8"/><circle class="ear" cx="55" cy="13" r="8"/><ellipse class="muzzle" cx="40" cy="29" rx="12" ry="8"/><path class="sash" d="M17 48Q40 39 63 48"/><path class="weapon" d="M68 8L69 84M61 15L75 15"/>`,
    'wolf-spirit':`<path class="tail" d="M17 52Q2 42 8 29"/><path class="beast-body" d="M14 45Q29 35 53 40Q65 43 69 55Q60 67 31 64Q14 62 14 45Z"/><path class="beast-head" d="M58 34L69 22L82 34L78 54L62 54Z"/><path class="ear" d="M61 29L61 15L69 25M72 27L79 15L79 34"/><path class="leg" d="M25 59L22 76M48 61L51 77M67 53L70 73"/><path class="fang" d="M77 47L84 51L77 54"/>`,
    'yellow-wind':`<path class="storm-robe" d="M38 25Q16 42 14 80H67Q65 42 44 25Z"/><circle class="face" cx="41" cy="23" r="13"/><path class="wind-crown" d="M24 16L29 2L38 13L45 0L52 13L60 4L58 20Z"/><path class="storm-sash" d="M10 49Q42 34 72 50M5 60Q43 47 77 62"/><path class="fan" d="M65 31Q84 34 82 53Q69 54 60 46Z M67 34L78 49"/>`,
    windling:`<path class="wind-body" d="M40 7Q64 17 54 34Q76 43 58 57Q67 76 41 82Q14 75 24 56Q4 43 27 33Q14 17 40 7Z"/><path class="wind-cut" d="M9 32Q38 23 70 32M6 51Q42 42 75 53M18 68Q42 61 66 69"/><circle class="eye" cx="34" cy="28" r="2"/><circle class="eye" cx="46" cy="28" r="2"/>`,
    'bone-spirit':`<path class="ghost-robe" d="M40 28Q18 39 14 79L27 72L38 82L48 72L64 79Q62 40 48 28Z"/><path class="pale-face" d="M26 12Q40 2 54 12L51 31Q40 38 29 31Z"/><path class="bone-crown" d="M22 15L25 1L35 10L41 0L48 10L58 2L56 18"/><path class="bone-staff" d="M70 7L65 82M64 9Q72 0 78 9Q72 17 64 9Z"/><path class="rib" d="M28 46H53M25 53H56M23 60H58"/>`,
    'bone-guard':`<path class="guard-skull" d="M29 8H53L57 24L49 34H33L25 24Z"/><path class="jaw" d="M32 29V38H50V29M36 31V37M42 31V37M47 31V37"/><path class="bone-armor" d="M21 39H61L67 76H15Z"/><path class="rib" d="M27 47H55M24 55H58M22 63H60"/><path class="spear" d="M73 5L72 82M66 14L73 3L80 14Z"/>`,
    'red-boy':`<circle class="face" cx="40" cy="23" r="13"/><circle class="topknot" cx="26" cy="7" r="8"/><circle class="topknot" cx="54" cy="7" r="8"/><path class="fire-robe" d="M27 35H53L63 76L40 68L17 76Z"/><path class="gold-sash" d="M18 47Q40 40 62 47M25 61H56"/><path class="fire-spear" d="M71 10L67 82M65 13L72 0L77 14Z"/><path class="flame-ribbon" d="M18 34Q2 43 17 53Q28 58 16 68"/>`,
    'fire-imp':`<path class="imp-flame" d="M40 2Q55 17 50 29Q70 41 58 61Q51 78 39 84Q19 75 20 57Q4 43 28 29Q22 14 40 2Z"/><circle class="imp-face" cx="40" cy="43" r="12"/><path class="imp-grin" d="M33 47Q40 53 47 47"/><path class="ember-fork" d="M13 34L4 26M66 34L76 26"/>`,
    'bull-demon':`<path class="bull-cape" d="M13 39Q40 22 67 39L76 84H5Z"/><path class="bull-head" d="M24 9H56L62 31L52 42H28L18 31Z"/><path class="great-horns" d="M24 17Q5 17 4 1Q13 10 28 9M56 17Q75 17 77 1Q68 10 52 9"/><path class="bull-armor" d="M16 43H65L69 72H11Z M22 50H59M19 59H62M16 68H65"/><path class="bull-glaive" d="M78 9L72 85M72 16Q85 8 88 19Q82 29 71 25"/>`,
    'bull-guard':`<path class="guard-body" d="M20 39H60L66 80H14Z"/><path class="bull-head" d="M27 12H53L58 31L48 40H32L22 31Z"/><path class="guard-horns" d="M26 19Q12 16 10 6M54 19Q68 16 70 6"/><path class="plate-lines" d="M20 49H60M18 59H62M16 69H64"/><path class="guard-spear" d="M72 5L72 82M65 15L72 2L79 15Z"/>`,
    'sky-horn':`<path class="cloud" d="M9 77Q8 65 21 65Q25 52 38 61Q49 49 58 61Q75 57 75 76Z"/><path class="raider-body" d="M22 36H58L63 69H17Z"/><path class="bull-head" d="M28 12H52L57 29L48 38H32L23 29Z"/><path class="guard-horns" d="M28 18Q15 14 13 4M52 18Q65 14 67 4"/><path class="cloud-blade" d="M70 8L66 67M62 16L71 4L77 17Z"/>`,
    'hooded-stranger':`<path class="ink-cape" d="M40 4Q65 19 69 82L52 74L41 88L28 75L10 82Q15 18 40 4Z"/><path class="hood" d="M21 18Q40 -2 59 18L55 43H25Z"/><path class="hidden-face" d="M28 23Q40 15 52 23L49 36H31Z"/><path class="borrowed-staff" d="M70 12L72 86M66 19L77 19"/><path class="red-glint" d="M34 29H46"/>`
  };
  return `<svg class="journey-enemy-art art-${token}" viewBox="0 0 88 92" aria-hidden="true" focusable="false">${art[token]}</svg>`;
}
function guanyinSvgMarkup(){return `<svg class="guanyin-art" viewBox="0 0 108 112" aria-hidden="true" focusable="false"><g class="lotus-halo"><circle cx="54" cy="34" r="27"/><path d="M54 3V14M27 12L35 21M81 12L73 21M17 36H30M91 36H78"/></g><g class="willow-vase"><path d="M86 52Q96 59 91 83H78Q74 60 84 52Z"/><path d="M84 54Q80 32 91 17M87 37Q97 30 99 20M87 44Q76 38 74 29"/></g><g class="seated-guanyin"><path class="guanyin-veil" d="M35 27Q54 9 73 27L79 70H29Z"/><circle class="guanyin-face" cx="54" cy="30" r="13"/><path class="guanyin-crown" d="M39 23Q54 10 69 23L64 18L60 24L54 12L48 24L44 18Z"/><path class="guanyin-robe" d="M37 44Q54 36 71 44L82 78H26Z"/><path class="guanyin-arms" d="M38 48Q45 58 54 59Q63 58 70 48M54 58V70"/></g><g class="lotus-seat"><path d="M54 69Q43 80 54 94Q65 80 54 69Z"/><path d="M51 78Q30 70 31 91Q43 98 54 94M57 78Q78 70 77 91Q65 98 54 94"/><path d="M37 84Q18 82 24 100Q40 108 54 96M71 84Q90 82 84 100Q68 108 54 96"/><path d="M24 100Q54 111 84 100"/></g></svg>`;}
function waterCurtainSvgMarkup(){return `<svg class="water-curtain-art" viewBox="0 0 126 108" aria-hidden="true" focusable="false"><path class="cave-mass" d="M4 98L15 49L34 26L47 35L63 7L78 34L92 24L115 52L123 98Z"/><path class="cave-ridges" d="M17 76L39 44L48 51L63 22L76 51L91 39L112 76"/><path class="cave-mouth" d="M35 99Q38 48 63 43Q89 49 92 99Z"/><path class="waterfall" d="M46 51Q61 42 80 51L76 98H49Z"/><path class="water-lines" d="M54 53L52 94M63 49L62 96M72 54L70 94"/><path class="cave-plaque" d="M35 35Q63 25 91 35L87 51Q63 43 39 51Z"/><text x="63" y="43" text-anchor="middle">水帘洞</text></svg>`;}
function ditingSvgMarkup(){return `<svg class="diting-art" viewBox="0 0 122 104" aria-hidden="true" focusable="false"><g class="diting-listening-halo"><path d="M16 23Q3 37 15 52M24 27Q14 38 24 48"/><path d="M84 22Q101 34 92 51M78 28Q89 37 82 47"/></g><path class="diting-tail" d="M31 72Q6 77 9 55Q11 43 23 51Q29 58 18 62"/><path class="diting-back-body" d="M27 48Q47 35 76 42Q99 47 103 68Q92 84 58 82Q31 83 21 68Q18 57 27 48Z"/><path class="diting-scale-line" d="M36 48Q43 56 50 48Q57 57 64 48Q71 57 78 49Q85 58 92 52M32 59Q40 67 48 59Q56 67 64 59Q72 67 80 59Q88 66 96 59"/><path class="diting-neck" d="M71 50Q70 31 83 22L99 31L98 61Z"/><path class="diting-head" d="M67 26Q73 8 93 8Q113 12 116 30L106 47Q89 54 72 43Z"/><path class="diting-ear diting-ear-left" d="M75 22Q51 8 56 35Q63 47 78 39Z"/><path class="diting-ear diting-ear-right" d="M102 20Q119 8 118 35Q114 43 105 39Z"/><path class="diting-horn" d="M84 11Q87 -2 98 1L93 15Z"/><path class="diting-brow" d="M76 28Q85 21 94 27M99 27Q106 23 112 28"/><circle class="diting-eye" cx="88" cy="30" r="2.5"/><circle class="diting-eye" cx="105" cy="30" r="2.5"/><path class="diting-muzzle" d="M83 34Q96 29 110 36L105 47Q94 51 82 44Z"/><path class="diting-nose" d="M99 35L106 38L101 42L95 39Z"/><path class="diting-foreleg" d="M78 62L75 88L88 88L91 62M98 60L96 86L109 86L108 57"/><path class="diting-hindleg" d="M32 67L27 88L42 88L47 69M55 70L53 90L68 90L72 69"/><path class="diting-paw" d="M25 89Q34 82 44 89M51 91Q60 84 69 91M73 89Q81 81 90 88M94 87Q102 80 111 86"/><path class="diting-collar" d="M71 45Q86 54 102 48L101 58Q84 63 72 54Z"/><circle class="diting-bell" cx="87" cy="59" r="5"/></svg>`;}
function underworldGuardSvgMarkup(unit){
  const ox=unit.underworldVariant!=='horse';
  const head=ox?`<path class="warden-horn" d="M29 25Q11 23 10 7Q20 16 34 14M53 24Q72 21 75 6Q64 15 50 14"/><path class="warden-face ox-face" d="M27 14H55L61 34L52 47H31L22 34Z"/><path class="warden-snout" d="M30 32Q41 26 53 33L50 43H33Z"/><circle class="warden-eye" cx="33" cy="27" r="2.5"/><circle class="warden-eye" cx="50" cy="27" r="2.5"/>`:`<path class="warden-ear" d="M31 17L28 1Q38 7 40 18M51 17L58 1Q62 10 57 23"/><path class="warden-mane" d="M25 13Q41 3 58 16L62 44L23 44Z"/><path class="warden-face horse-face" d="M30 10Q47 6 56 21L52 48L41 55L29 45Z"/><path class="warden-muzzle" d="M31 34Q41 29 53 36L49 50H36Z"/><circle class="warden-eye" cx="36" cy="25" r="2.5"/><circle class="warden-eye" cx="49" cy="25" r="2.5"/>`;
  return `<svg class="underworld-art art-${ox?'ox':'horse'}-warden" viewBox="0 0 94 104" aria-hidden="true" focusable="false"><path class="warden-shadow-cape" d="M16 44Q41 31 68 45L77 91H8Z"/><path class="warden-armor" d="M19 47H66L71 83H13Z"/><path class="warden-plate" d="M25 51H59L57 72H27Z"/><path class="warden-sash" d="M14 69Q43 60 71 71"/>${head}<path class="warden-seal" d="M34 54H52V70H34Z"/><text x="43" y="66" text-anchor="middle">令</text><path class="warden-weapon" d="M77 12L74 94M68 20L84 20M70 24L82 34L69 37Z"/><path class="warden-chain" d="M17 54Q2 61 11 77Q18 86 26 77"/><circle class="chain-ring" cx="13" cy="82" r="6"/><path class="warden-boots" d="M25 80L20 96H38M57 80L62 96H80"/></svg>`;
}
function figureMarkup(unit){const mounted=['tang','falsetang'].includes(unit.type),enemyArt=journeyEnemySvgMarkup(unit),specialArt=unit.type==='guanyin'?guanyinSvgMarkup():unit.type==='watercurtain'?waterCurtainSvgMarkup():unit.type==='diting'?ditingSvgMarkup():unit.type==='underworld'?underworldGuardSvgMarkup(unit):'';return `<div class="figure ${enemyArt||specialArt?'vector-enemy-figure':''}">${mounted?horseSvgMarkup():''}${enemyArt}${specialArt}<i class="cape"></i><i class="crown"></i><i class="head"></i><i class="armor"></i><i class="body"></i><i class="staff"></i><i class="ornament"></i></div>`;}
function sixEaredIsVeiled(unit,battle,run){return unit.id==='false-wukong'&&(battle.id==='false-party'||(battle.id==='duel'&&!run.sixEaredColorRevealed));}
function renderUnits(){
  if(!$('unit-layer'))return;
  const now=Date.now(),battle=BATTLES[state.scene];$('unit-layer').innerHTML=state.units.map(unit=>{const pos=positionFor(unit);const pct=Math.max(0,unit.hp/unit.maxHp*100);const draggable=state.phase==='formation'&&unit.team==='player'&&!unit.fixed;const label=unit.displayName||((unit.id==='false-wukong'&&!state.traitReveal)?'Sun Wukong':unit.name),auraSpecs=positionalAuraSpecs(unit,state.units),auraSymbol=[...new Set(auraSpecs.map(spec=>spec.symbol))].join(''),veiled=sixEaredIsVeiled(unit,battle,state);return `<div class="unit ${unit.team} ${unit.kind} ${unit.authority?'authority':''} ${veiled?'six-eared-veiled':''} ${unit.dead?'dead':''} ${unit.ward>0?'warded':''} ${unit.hidden?'hidden-unit':''} ${unit.retreating?'retreating':''} ${unit.activeFrozenUntil>now?'active-frozen':''} ${unit.tightFilletUntil>now?'tight-fillet-pain':''} ${unit.goldenUntil>now?'golden-body':''} ${auraSpecs.length?'position-source':''} ${selectedDeploymentId===unit.id?'selected-unit':''}" id="unit-${unit.id}" style="left:${pos.left};top:${pos.top}" data-unit="${unit.id}" data-aura-symbol="${auraSymbol}" draggable="${draggable}" tabindex="0">${figureMarkup(unit)}<div class="unit-name">${label}</div><div class="hp-track"><div class="hp-fill" style="width:${pct}%"></div></div></div>`;}).join('');
  document.querySelectorAll('.unit').forEach(node=>{
    node.onmouseenter=()=>{showInsight(node.dataset.unit);hoveredAuraOwnerId=node.dataset.unit;renderHexes();};
    node.onmouseleave=()=>{if(hoveredAuraOwnerId===node.dataset.unit){hoveredAuraOwnerId=null;renderHexes();}};
    node.onfocus=()=>{showInsight(node.dataset.unit);hoveredAuraOwnerId=node.dataset.unit;renderHexes();};
    node.onblur=()=>{if(hoveredAuraOwnerId===node.dataset.unit){hoveredAuraOwnerId=null;renderHexes();}};
    if(node.draggable){
      node.onclick=()=>{const target=state.units.find(unit=>unit.id===node.dataset.unit);if(selectedDeploymentId&&selectedDeploymentId!==node.dataset.unit)moveDeployment(target.q,target.r,selectedDeploymentId);else{selectedDeploymentId=node.dataset.unit;renderUnits();}};
      node.ondragstart=event=>{draggingUnitId=node.dataset.unit;event.dataTransfer?.setData('text/plain',draggingUnitId);node.classList.add('dragging');};
      node.ondragover=event=>event.preventDefault();
      node.ondrop=event=>{event.preventDefault();const target=state.units.find(unit=>unit.id===node.dataset.unit);moveDeployment(target.q,target.r,draggingUnitId||event.dataTransfer?.getData('text/plain'));};
      node.ondragend=()=>{draggingUnitId=null;node.classList.remove('dragging');};
    }
  });
  renderHexes();
}
function renderTraits(){
  const panel=$('active-skills');if(!panel)return;
  const activeChoices=Object.entries(state.partyChoices).flatMap(([owner,history])=>history.chosen.filter(id=>PARTY_SKILL_LOOKUP[id]?.active).map(id=>({owner,id,skill:PARTY_SKILL_LOOKUP[id]})));
  panel.innerHTML=activeChoices.map(({owner,id,skill})=>{
    const actor=state.units.find(unit=>unit.team==='player'&&unit.type!=='hairclone'&&partyOwnerForUnit(unit)===owner&&!unit.dead),used=state.activeSkillsUsed.chosen.includes(id),available=state.phase==='battle'&&!state.revealInProgress&&actor&&!used;
    const status=used?'SPENT':state.revealInProgress?'WAIT':!actor?'ABSENT':available?'CAST':'READY',ownerName={wukong:'Wukong',wujing:'Wujing',tang:'Sanzang'}[owner]||PARTY_SKILLS[owner].name;
    return `<div class="active-skill-row ${used?'spent':''}"><button class="active-skill-card" data-active-skill="${id}" ${available?'':'disabled'} aria-label="${ownerName}, ${skill.name}: ${status.toLowerCase()}" aria-describedby="active-effect-${id} active-use-rule"><span class="active-sigil" aria-hidden="true">${skill.sigil}</span><span class="active-copy"><strong>${skill.name}</strong><small>${ownerName} · ${status}</small></span><span class="active-charge" aria-label="${used?0:1} use remaining">${used?'0':'1'}</span></button><div class="active-skill-description" id="active-effect-${id}"><p>${skill.description}</p></div></div>`;
  }).join('')||'<div class="active-empty"><p><strong>No active skills yet.</strong><br>Learn them after battle.</p></div>';
  panel.querySelectorAll('[data-active-skill]').forEach(button=>button.onclick=()=>activatePlayerSkill(button.dataset.activeSkill));
}
function renderHeader(){const battle=BATTLES[state.scene],journeyAction=$('abandon-button');$('chapter-kicker').textContent=battle.chapter;$('chapter-title').textContent=battle.title;$('story-speaker').textContent=battle.speaker;$('story-copy').textContent=battle.story;$('objective-copy').textContent=battle.objective;$('arena').classList.toggle('duel',battle.id==='duel'||battle.id==='guanyin'||battle.id==='heaven');journeyAction.textContent=journeyActionLabel(state);journeyAction.setAttribute('aria-label',journeyHasBegun(state)?'Abandon the current Journey West':'Skip the prologue and begin the Journey West');document.querySelector('.player-caption').textContent=battle.guanyinGuest?'TRUE PILGRIMAGE · GUANYIN GUEST':battle.protectTang?'SUN WUKONG · PROTECT TANG SANZANG':battle.journeyBattle?'DEFEAT ALL · PROTECT TANG SANZANG':battle.id==='false-party'||battle.partyBattle?'TRUE PILGRIMAGE · SUN WUKONG ABSENT':battle.id==='diting'?'TRUE PILGRIMAGE · PROTECT DITING':battle.id==='unchosen'?'TRUE PILGRIMAGE':battle.id==='mountain-opens'?'MASTER · DISCIPLE':'SUN WUKONG 孙悟空';}
function renderAll(){renderHeader();renderHexes();renderUnits();renderTraits();renderChronicle();}
function showInsight(id){const unit=state.units.find(entry=>entry.id===id);if(!unit)return;const traits=unit.traits.map(t=>`${TRAITS[t].name} (${TRAITS[t].cn})`).join(' · ')||'None';const skills=unit.partySkills.map(skillId=>{const skill=PARTY_SKILL_LOOKUP[skillId];return `${skill.name} (${skill.cn}) — ${skill.short}`;}).join('<br>')||'None';const techniques=unit.type==='hairdecoy'?'False Body':unit.mythic?'Mythic Loadout':unit.skill,isBuddha=unit.type==='buddha',skillHeading=unit.type==='mysterywukong'?'BORROWED SKILLS':'CHOSEN SKILLS';const role=isBuddha?'BOSS':unit.authority?'AUTHORITY':unit.team==='player'?'TRUE SELF':'OPPONENT',stats=isBuddha?'<span>HP ???</span><span>ATK ???</span><span>RANGE ???</span>':unit.authority?'<span>UNTOUCHABLE</span>':`<span>HP ${Math.max(0,unit.hp)}/${unit.maxHp}</span><span>ATK ${unit.atk}</span><span>RANGE ${unit.range}</span>`;$('unit-insight').innerHTML=`<p class="eyebrow">${role}</p><h2>${unit.displayName||named(unit)}</h2><div class="stat-line">${stats}</div><p><b>BASE ROLE</b><br>${techniques}</p><p>${unit.skillCopy}</p>${unit.authority?'':`<p><b>${skillHeading}</b><br>${skills}</p><p><b>TRAITS</b><br>${traits}</p>`}`;}
function moveDeployment(q,r,unitId=null){const battle=BATTLES[state.scene],allowed=deploymentCellsForBattle(battle);if(state.phase!=='formation')return false;const id=unitId||'true-wukong',hero=state.units.find(unit=>unit.id===id&&unit.team==='player');if(!hero)return false;const result=placeUnit(state.units,id,{q,r},allowed);if(!result.moved)return false;if(journeyHasBegun(state))rememberPartyFormation(state,state.units);else if(id==='true-wukong')state.deploy={q,r};rememberHairDecoyFormation(state,state.units);selectedDeploymentId=id;renderUnits();setCopy(result.swapped?`${hero.name} swaps places with ${state.units.find(unit=>unit.id===result.occupantId).name}.`:`${hero.name} takes position at hex ${q}, ${r}.`);return true;}

function fxAt(unit,type,text,duration=850){if(!$('fx-layer'))return;const pos=positionFor(unit);const node=document.createElement('div');node.className=`fx-${type}`;node.style.left=pos.left;node.style.top=pos.top;if(text)node.textContent=text;$('fx-layer').append(node);setTimeout(()=>node.remove(),duration);}
function showHealingFx(unit,amount){fxAt(unit,'healing-bloom','',950);fxAt(unit,'heal-text',`+${amount}`,1050);}
function healTarget(target,amount){const healed=Math.max(0,Math.min(amount,target.maxHp-target.hp));if(!healed)return 0;target.hp+=healed;showHealingFx(target,healed);return healed;}
function arenaFx(type,duration=900){if(!$('fx-layer'))return;const node=document.createElement('div');node.className=`fx-${type}`;$('fx-layer').append(node);setTimeout(()=>node.remove(),duration);}
function showStunFx(unit,label='STUNNED'){fxAt(unit,'stun-lock','定',1050);fxAt(unit,'stun-stars','',1050);if(label)fxAt(unit,'text',label,900);}
function activeFreezeRemaining(unit,now=Date.now()){return Math.max(0,(unit?.activeFrozenUntil||0)-now);}
function fxBetweenHexes(from,to,type,duration=760){if(!$('fx-layer')||!$('arena'))return;const bounds=$('arena').getBoundingClientRect(),start=positionFor(from),end=positionFor(to),x1=parseFloat(start.left)*bounds.width/100,y1=parseFloat(start.top)*bounds.height/100,x2=parseFloat(end.left)*bounds.width/100,y2=parseFloat(end.top)*bounds.height/100,node=document.createElement('div');node.className=`fx-${type}`;node.style.left=`${x1}px`;node.style.top=`${y1}px`;node.style.width=`${Math.hypot(x2-x1,y2-y1)}px`;node.style.transform=`rotate(${Math.atan2(y2-y1,x2-x1)}rad)`;$('fx-layer').append(node);setTimeout(()=>node.remove(),duration);}
function showKnockbackFx(target,origin,destination,label='KNOCKBACK',style='force'){
  if(sameHex(origin,destination)){fxAt(destination,style==='water'?'knockback-water-landing':'knockback-force-landing','',820);fxAt(destination,'text','BLOCKED',900);return;}
  const bounds=$('arena')?.getBoundingClientRect(),start=positionFor(origin),end=positionFor(destination),dx=bounds?(parseFloat(end.left)-parseFloat(start.left))*bounds.width/100:0,dy=bounds?(parseFloat(end.top)-parseFloat(start.top))*bounds.height/100:0,node=$(`unit-${target.id}`);
  if(node){node.style.setProperty('--knock-from-x',`${-dx}px`);node.style.setProperty('--knock-from-y',`${-dy}px`);node.classList.add('knockback-moving');setTimeout(()=>node.classList.remove('knockback-moving'),620);}
  fxBetweenHexes(origin,destination,style==='water'?'knockback-water-trail':'knockback-force-trail',760);fxAt(origin,style==='water'?'knockback-water-origin':'knockback-force-origin','',720);fxAt(destination,style==='water'?'knockback-water-landing':'knockback-force-landing','',820);fxAt(destination,'text',label,900);
}
function activeSkillHistory(actor){return actor?.team==='player'?'chosen':'discarded';}
function activeSkillCanUse(actor,skillId,run=state){const history=activeSkillHistory(actor);return Boolean(!run.revealInProgress&&actor&&!actor.dead&&actor.type!=='hairclone'&&PARTY_SKILL_LOOKUP[skillId]?.active&&actor.partySkills?.includes(skillId)&&!run.activeSkillsUsed[history].includes(skillId));}
function resolveActiveSkill(actor,skillId,now=Date.now()){
  if(!activeSkillCanUse(actor,skillId))return false;
  const skill=PARTY_SKILL_LOOKUP[skillId],history=activeSkillHistory(actor),opponents=living(state.units,actor.team==='player'?'enemy':'player');state.activeSkillsUsed[history].push(skillId);
  if(skillId==='massfreeze'){
    opponents.forEach(target=>{target.activeFrozenUntil=now+skill.durationMs;showStunFx(target,'STUNNED');});arenaFx('mass-freeze',900);setCopy(`${actor.name} casts Binding Spell. All enemies are stunned for 3s.`);renderUnits();setTimeout(()=>renderUnits(),skill.durationMs+50);
  }else if(skillId==='tidalwave'){
    const placements=tidalWavePlacements(actor,opponents,state.units),moves=placements.map(place=>{const target=state.units.find(unit=>unit.id===place.id);return {target,origin:{q:target.q,r:target.r},destination:{q:place.q,r:place.r}};});moves.forEach(({target,destination})=>{target.q=destination.q;target.r=destination.r;target.moved=true;});arenaFx('tidal-surge',1050);renderUnits();moves.forEach(({target,origin,destination})=>showKnockbackFx(target,origin,destination,'SWEPT','water'));setCopy(`${actor.name} summons a great wave and washes every enemy to the far edge.`);
  }else if(skillId==='goldenbody'){
    actor.goldenUntil=now+skill.durationMs;arenaFx('golden-body-burst',850);fxAt(actor,'gold-ring');fxAt(actor,'text',skill.name.toUpperCase());setCopy(`${actor.name} takes Golden Form: no damage for 3s.`);renderUnits();setTimeout(()=>renderUnits(),skill.durationMs+50);
  }else return false;
  renderTraits();return true;
}
function activatePlayerSkill(skillId){if(state.phase!=='battle')return false;const actor=state.units.find(unit=>unit.team==='player'&&unit.type!=='hairclone'&&!unit.dead&&unit.partySkills?.includes(skillId));return resolveActiveSkill(actor,skillId);}
function maybeActivateEnemySkill(actor){if(actor.team!=='enemy'||actor.type==='hairclone'||BATTLES[state.scene]?.suppressEnemyActives)return false;const skillId=actor.partySkills?.find(id=>PARTY_SKILL_LOOKUP[id]?.active);return skillId&&activeSkillCanUse(actor,skillId)&&actor.turns===0?resolveActiveSkill(actor,skillId):false;}
function setMythicLandmark(mode='',variant=state?.mountainVariant||1){const node=$('mythic-landmark'),foreground=$('mythic-foreground');if(!node)return;const mountainClass=mode.includes('mountain')?` mountain-variant-${variant}`:'';node.className=`mythic-landmark${mode?` landmark-${mode}`:''}${mountainClass}`;if(foreground)foreground.className=`mythic-foreground${mode?` landmark-${mode}`:''}${mountainClass}`;}
function fxBetween(actor,target,type,duration=700){if(!$('fx-layer'))return;const from=$(`unit-${actor.id}`)?.getBoundingClientRect(),to=$(`unit-${target.id}`)?.getBoundingClientRect(),layer=$('fx-layer').getBoundingClientRect();if(!from||!to)return;const x1=from.left+from.width/2-layer.left,y1=from.top+from.height/2-layer.top,x2=to.left+to.width/2-layer.left,y2=to.top+to.height/2-layer.top,node=document.createElement('div');node.className=`fx-${type}`;node.style.left=`${x1}px`;node.style.top=`${y1}px`;node.style.width=`${Math.hypot(x2-x1,y2-y1)}px`;node.style.transform=`rotate(${Math.atan2(y2-y1,x2-x1)}rad)`;$('fx-layer').append(node);setTimeout(()=>node.remove(),duration);}
function unitMotionFx(unit,type,duration=560){const node=$(`unit-${unit.id}`);if(!node)return;node.classList.add(`enemy-motion-${type}`);setTimeout(()=>node.classList.remove(`enemy-motion-${type}`),duration);}
function journeyAttackFx(actor,target){
  const effects={leader:['bandit-cleave','dao-cleave','dust-impact'],sword:['bandit-slash','dao-flash','slash-sparks'],archer:['archer-release','bow-release','arrow-impact'],monkey:['monkey-vault','rough-staff','staff-impact'],blackbear:['staff-slam','weapon-slam','earth-hit'],wolfspirit:['wolf-pounce','paw-dust','claw-burst'],yellowwind:['fan-cast','fan-gust','wind-vortex'],windling:['gust-spin','wind-coil','sand-cut'],bonespirit:['bone-rite','bone-summon','ghost-bloom'],boneguard:['spear-thrust','spear-flash','bone-spark'],redboy:['fire-spear','spear-flame','flame-burst'],fireimp:['ember-hop','ember-hop','ember-burst'],bulldemon:['glaive-slam','glaive-arc','earth-hit'],bullguard:['bull-charge','horn-dust','earth-hit'],skyhorn:['cloud-plunge','cloud-plunge','cloud-burst'],mysterywukong:['ink-step','ink-cut','ink-bloom']};
  const effect=effects[actor.type];if(!effect)return;unitMotionFx(actor,effect[0]);fxAt(actor,effect[1],'',760);fxAt(target,effect[2],'',820);
}
async function animateAttack(actor,target,damage,label=''){
  const actorNode=$(`unit-${actor.id}`),targetNode=$(`unit-${target.id}`);actorNode?.classList.add('attacking');await wait(55);targetNode?.classList.add('hit');fxAt(target,'slash');fxAt(target,'text',label||`-${damage}`);await wait(85);actorNode?.classList.remove('attacking');targetNode?.classList.remove('hit');
}
function damageTarget(target,damage,attacker=null,units=state.units){
  if(target.type==='buddha'){fxAt(target,'gold-ring');fxAt(target,'text','0');setCopy('The Ruyi Jingu Bang lands. The Buddha does not lose a single point of HP.');return 0;}
  if(target.goldenUntil>Date.now()){fxAt(target,'gold-ring');fxAt(target,'text','INVULNERABLE');setCopy('Golden Form turns the attack aside.');return 0;}
  let dealt=Math.max(1,Math.ceil(damage*formationDamageMultiplier(target,units)));
  if(target.ward>0){target.ward-=1;dealt=Math.ceil(dealt*.5);fxAt(target,'ward-break');fxAt(target,'text','WARD');setCopy('Ward halves the hit.');}
  if(target.traits.includes('adamant')&&!target.adamantUsed){target.adamantUsed=true;dealt=Math.ceil(dealt*.5);activateTrait(target,'adamant','Adamant Body halves the first damaging hit.');}
  if(target.type==='shieldgeneral'&&!target.shieldUsed){target.shieldUsed=true;dealt=Math.ceil(dealt*.5);fxAt(target,'gold-ring');fxAt(target,'text','BLOCK');setCopy('Celestial Shield halves the first hit.');}
  const burden=living(units,target.team).find(unit=>partyOwnerForUnit(unit)==='tang'&&unit.partySkills?.includes('sharedburden')&&unit.id!==target.id&&hexDistance(unit,target)<=1);
  if(burden&&dealt>=target.hp&&burden.hp>1){const shared=Math.min(Math.floor(dealt/2),burden.hp-1);dealt-=shared;burden.hp-=shared;fxAt(burden,'text',`-${shared} SHARE`);}
  if(target.type==='mysterywukong'){
    const threshold=mysteryRetreatThreshold(target),nextHp=target.hp-dealt;
    if(nextHp<=threshold){dealt=Math.max(0,target.hp-threshold);target.hp=threshold;target.retreating=true;return dealt;}
  }
  target.hp-=dealt;if(settleHealth(target))recordUnitFall(target,attacker);return dealt;
}
function mysteryRetreatThreshold(unit){return Math.ceil(unit.maxHp*.25);}
function mysteryReadyToRetreat(unit){return unit.type==='mysterywukong'&&!unit.dead&&unit.hp<=mysteryRetreatThreshold(unit);}
function settleHealth(target){
  if(target.hp>0)return false;
  target.hp=0;target.dead=true;return true;
}
function triggerInkBurst(decoy){
  if(decoy.type!=='hairdecoy'||!decoy.summonerTraits?.includes('inkburst'))return;
  const foes=living(state.units,decoy.team==='player'?'enemy':'player').filter(unit=>hexDistance(decoy,unit)<=1);
  foes.forEach(unit=>{unit.disrupted=Math.max(1,unit.disrupted);showStunFx(unit,'STAGGERED');});fxAt(decoy,'ink');
  setCopy(`Ink Burst staggers ${foes.length} nearby ${foes.length===1?'foe':'foes'}.`);
}
async function performLeapAttack(actor,target){
  const origin={q:actor.q,r:actor.r},occupied=new Set(state.units.filter(unit=>!unit.dead&&unit.id!==actor.id).map(hexKey));
  const landing=NEIGHBORS.map(delta=>({q:target.q+delta.q,r:target.r+delta.r})).filter(cell=>isValidHex(cell)&&!occupied.has(hexKey(cell))).sort((a,b)=>hexDistance(origin,a)-hexDistance(origin,b))[0]||origin;
  actor.q=landing.q;actor.r=landing.r;renderUnits();$(`unit-${actor.id}`)?.classList.add('leaping');fxAt(actor,'text','LEAP');await wait(180);
  actor.attacks+=1;const dealt=damageTarget(target,Math.round(actor.atk*1.2),actor,state.units);activateTrait(actor,'somersault','Somersault Raid: strike, then return.');await animateAttack(actor,target,dealt,'LEAP HIT');
  if(target.hp<=0){target.dead=true;triggerKill(actor,state.units);}
  actor.q=origin.q;actor.r=origin.r;renderUnits();fxAt(actor,'ring');fxAt(actor,'text','RETURN');await wait(160);return true;
}
async function performHoundFlurry(actor,target){
  actor.openingUsed=true;actor.attacks+=1;fxBetween(actor,target,'hound-arc',800);fxAt(actor,'text','FIRST HUNT');setCopy(`Xiaotian Quan acts first and mauls ${target.name}.`);
  let bites=0;for(let index=0;index<5&&!target.dead;index+=1){bites+=1;const dealt=damageTarget(target,Math.max(1,Math.round(actor.atk*.55)),actor,state.units);fxAt(target,'claw-ring','',420);await animateAttack(actor,target,dealt,`FANG ${index+1}`);if(target.dead){triggerInkBurst(target);break;}}
  if(target.id==='true-wukong'&&!target.dead){target.disrupted=Math.max(1,target.disrupted);const erlang=state.units.find(unit=>unit.type==='erlang'&&!unit.dead);if(erlang)erlang.specialTarget=target.id;fxAt(target,'scent-mark','',1000);showStunFx(target,'HOUND LOCK');}
  setCopy(target.dead?`${target.name} absorbs ${bites} bites and ends First Hunt.`:`First Hunt lands ${bites} bites on ${target.name}.`);renderUnits();await wait(100);return true;
}
function lastRowLanding(actor,target,units){const occupied=new Set(units.filter(unit=>!unit.dead&&unit.id!==actor.id).map(hexKey));return generateHexes().filter(cell=>cell.r===RADIUS&&!occupied.has(hexKey(cell))).sort((a,b)=>hexDistance(target,a)-hexDistance(target,b)||hexDistance(actor,a)-hexDistance(actor,b)||a.q-b.q)[0]||null;}
async function performBacklinePounce(actor,target,label='BACKLINE POUNCE',multiplier=1.5,forceLastRow=false){
  const occupied=new Set(state.units.filter(unit=>!unit.dead&&unit.id!==actor.id).map(hexKey)),landing=forceLastRow?lastRowLanding(actor,target,state.units):NEIGHBORS.map(delta=>({q:target.q+delta.q,r:target.r+delta.r})).filter(cell=>isValidHex(cell)&&!occupied.has(hexKey(cell))).sort((a,b)=>hexDistance(actor,a)-hexDistance(actor,b))[0];
  if(!landing)return false;actor.openingUsed=true;actor.q=landing.q;actor.r=landing.r;actor.moved=true;renderUnits();$(`unit-${actor.id}`)?.classList.add('leaping');fxBetween(actor,target,'hound-arc',900);fxAt(actor,'text',label);await wait(180);actor.attacks+=1;
  if(target.partySkills?.includes('horseguard')&&!target.specialUsed){target.specialUsed=true;actor.disrupted=Math.max(1,actor.disrupted);fxAt(target,'gold-ring');showStunFx(actor,'DRAGON REBUFF');setCopy(`White Dragon Horse stops ${actor.name} at the scripture bearer.`);renderUnits();await wait(100);return true;}
  const dealt=damageTarget(target,Math.round(actor.atk*multiplier),actor,state.units);await animateAttack(actor,target,dealt,label);fxAt(target,'claw-ring');if(actor.type==='heavenlyhound'&&!target.dead){target.disrupted=Math.max(1,target.disrupted);showStunFx(target,'STAGGERED');}setCopy(`${actor.name} leaps over the frontline and hits ${target.name} for ${dealt}.`);if(target.dead)target.dead=true;renderUnits();await wait(100);return true;
}
async function revealSixEaredColor(unit){
  if(unit.id!=='false-wukong'||BATTLES[state.scene].id!=='duel'||state.sixEaredColorRevealed||state.revealInProgress)return false;
  const run=state,units=state.units,started=Date.now(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const current=()=>state===run&&state.units===units&&state.phase==='battle';
  run.revealInProgress=true;renderTraits();
  const wind=document.createElement('div'),pos=positionFor(unit);wind.className='fx-mirror-whirlwind';wind.setAttribute('aria-hidden','true');wind.style.left=pos.left;wind.style.top=pos.top;
  wind.innerHTML='<i class="wind-skirt"></i><i class="wind-band band-low"></i><i class="wind-band band-mid"></i><i class="wind-band band-high"></i><i class="wind-crown"></i>';
  $('fx-layer').append(wind);$('battle-status').textContent='A SECOND SELF';setCopy('Wind coils around the gray figure.');
  try{
    await new Promise(resolve=>setTimeout(resolve,reduced?120:850));
    if(!current())return false;
    run.sixEaredColorRevealed=true;renderUnits();wind.classList.add('color-break');
    const node=$(`unit-${unit.id}`);node?.classList.add('six-eared-unveiling');
    setCopy('The wind parts. His face, his robes—even the gold of his staff. All mine.');
    await new Promise(resolve=>setTimeout(resolve,reduced?180:1150));
    if(!current())return false;
    node?.classList.remove('six-eared-unveiling');
    // The cinematic pauses the action queue, so existing timed powers retain their remaining time.
    const elapsed=Date.now()-started;
    units.forEach(fighter=>{for(const key of ['activeFrozenUntil','goldenUntil'])if(fighter[key]>started)fighter[key]+=elapsed;});
    $('battle-status').textContent='IN MOTION';return true;
  }finally{wind.remove();run.revealInProgress=false;if(current())renderTraits();}
}
function activateTrait(unit,traitId,copy){state.traitReveal=unit.id==='false-wukong'?traitId:state.traitReveal;const node=$(`unit-${unit.id}`);node?.classList.add('trait-active');fxAt(unit,'ring');fxAt(unit,'text',TRAITS[traitId].name.toUpperCase());setCopy(copy||`${named(unit)} invokes ${TRAITS[traitId].name}.`);setTimeout(()=>node?.classList.remove('trait-active'),900);renderTraits();}
function activateTechnique(unit,techniqueId,copy){const technique=TECHNIQUES[techniqueId];const node=$(`unit-${unit.id}`);node?.classList.add('technique-active');fxAt(unit,'gold-ring');fxAt(unit,'text',technique.cn);setCopy(copy||`${named(unit)} uses ${technique.name}.`);setTimeout(()=>node?.classList.remove('technique-active'),900);}
function triggerVigilance(target,attacker){if(!target.traits.includes('vigilance')||target.vigilanceUsed||hexDistance(target,attacker)<=1)return;target.vigilanceUsed=true;target.specialTarget=attacker.id;activateTrait(target,'vigilance',`${TRAITS.vigilance.name}: ${target.name} marks the distant attacker.`);}
function triggerKill(actor,units){if(!actor.traits.includes('killing'))return;const foes=living(units,actor.team==='player'?'enemy':'player').sort((a,b)=>a.hp-b.hp||a.id.localeCompare(b.id));if(foes[0]){actor.specialTarget=foes[0].id;if(BATTLES[state.scene].id!=='false-party')activateTrait(actor,'killing',`${TRAITS.killing.name}: ${actor.name} turns toward the weakest life.`);}}
function summonPagodaSoldiers(actor){
  const occupied=new Set(state.units.filter(unit=>!unit.dead).map(hexKey));
  const cells=[...NEIGHBORS.map(delta=>({q:actor.q+delta.q,r:actor.r+delta.r})),...generateHexes().filter(cell=>cell.r<=0)].filter(cell=>isValidHex(cell)&&!occupied.has(hexKey(cell))).slice(0,3);
  const wave=actor.specialCount+1;cells.forEach((cell,index)=>{const soldier=makeUnit('heavensoldier',`pagoda-reinforcement-${wave}-${index+1}`,'enemy',cell.q,cell.r);soldier.ward=1;state.units.push(soldier);});
  actor.specialCount=wave;renderUnits();fxAt(actor,'pagoda-column','',1100);fxAt(actor,'text',`MUSTER ${wave}`,1050);cells.forEach(cell=>fxAt(cell,'summon-seal','',900));setCopy(`Endless Muster ${wave} calls ${cells.length} Ward soldiers. Li Jing will summon again.`);
}
function summonBoneGuard(actor){
  const occupied=new Set(state.units.filter(unit=>!unit.dead).map(hexKey)),cell=NEIGHBORS.map(delta=>({q:actor.q+delta.q,r:actor.r+delta.r})).find(spot=>isValidHex(spot)&&!occupied.has(hexKey(spot)));
  if(!cell)return false;actor.specialCount+=1;state.units.push(makeUnit('boneguard',`${actor.id}-bone-${actor.specialCount}`,actor.team,cell.q,cell.r));renderUnits();fxAt(actor,'ink');fxAt(cell,'summon-seal');fxAt(actor,'text','BORROWED FACE');setCopy('White Bone Spirit raises another guarded shell.');return true;
}

function summonFalseMonkeys(actor){
  const livingSpawned=living(state.units,actor.team).filter(unit=>unit.type==='cavemonkey');if(livingSpawned.length>=6)return 0;
  const occupied=new Set(state.units.filter(unit=>!unit.dead).map(hexKey));
  const cells=[...NEIGHBORS.map(delta=>({q:actor.q+delta.q,r:actor.r+delta.r})),...generateHexes().filter(cell=>cell.r<=0)].filter(cell=>isValidHex(cell)&&!occupied.has(hexKey(cell))).slice(0,Math.min(2,6-livingSpawned.length));
  actor.specialCount+=1;cells.forEach((cell,index)=>state.units.push(makeUnit('cavemonkey',`${actor.id}-troop-${actor.specialCount}-${index+1}`,actor.team,cell.q,cell.r)));
  renderUnits();fxAt(actor,'cave-surge','',1100);fxAt(actor,'text',`FALSE TROOP ${actor.specialCount}`,1000);cells.forEach(cell=>fxAt(cell,'monkey-spawn','',950));setCopy(`Endless Imitation sends ${cells.length} weak False ${cells.length===1?'Monkey':'Monkeys'} from the Cave.`);return cells.length;
}

async function actWaterCurtainCave(actor){
  actor.turns+=1;if(actor.turns%2===1)summonFalseMonkeys(actor);else{fxAt(actor,'waterfall-pulse','',700);setCopy('The False Water Curtain Cave gathers another imitation wave.');}
  await wait(150);
}

async function actGuanyinGuest(actor){
  actor.turns+=1;const foes=living(state.units,'enemy');if(!foes.length)return;
  const target=[...foes].sort((a,b)=>b.hp-a.hp||hexDistance(actor,a)-hexDistance(actor,b))[0];
  if(actor.turns%3===0){
    const cluster=foes.filter(unit=>hexDistance(unit,target)<=1);for(const foe of cluster){const dealt=damageTarget(foe,Math.round(actor.atk*1.35),actor,state.units);fxAt(foe,'holy-light','',1000);fxAt(foe,'text',`-${dealt}`);}
    const allies=living(state.units,'player').filter(unit=>unit.id!==actor.id&&hexDistance(unit,actor)<=2&&unit.hp<unit.maxHp);allies.forEach(unit=>healTarget(unit,16));
    fxAt(actor,'lotus-radiance','',1100);setCopy(`Holy Light strikes ${cluster.length} ${cluster.length===1?'enemy':'enemies'} and restores allies beneath the Lotus.`);renderUnits();await wait(190);return;
  }
  const distance=hexDistance(actor,target);if(distance>actor.range){const step=nextStep(actor,target,state.units,state.blockedHexes);actor.q=step.q;actor.r=step.r;actor.moved=true;renderUnits();setCopy('Guanyin carries the lotus within range.');await wait(100);return;}
  actor.attacks+=1;fxBetween(actor,target,'willow-light',850);const dealt=damageTarget(target,Math.round(actor.atk*formationAttackMultiplier(actor,state.units)),actor,state.units);await animateAttack(actor,target,dealt,'LOTUS RAY');setCopy(`Guanyin casts a distant lotus ray for ${dealt}.`);renderUnits();await wait(90);
}

async function performRuyiThrow(actor,target){
  actor.attacks+=1;const targets=ruyiLineTargets(actor,target,state.units),copies=actor.traits.includes('twinstrike')?2:1;
  activateTechnique(actor,'ruyithrow',`${actor.name} throws the staff through ${targets.length} ${targets.length===1?'foe':'foes'} — and calls it back.`);
  for(let copy=0;copy<copies;copy+=1){
    const scale=copy===0?1:.65;if(copy===1)activateTrait(actor,'twinstrike','Twin Strike repeats the entire throw.');
    for(const returning of [false,true]){
      const ordered=returning?[...targets].reverse():targets;
      for(const victim of ordered){
        if(victim.dead)continue;const factor=returning?(actor.traits.includes('returning') ? .8 : .45):.7;
        const dealt=damageTarget(victim,Math.max(1,Math.round(actor.atk*factor*scale)),actor,state.units);fxAt(victim,returning?'return-staff':'throw-staff');fxAt(victim,'text',`-${dealt}`);triggerVigilance(victim,actor);
        if(actor.traits.includes('sweep')){
          const foes=living(state.units,actor.team==='player'?'enemy':'player').filter(unit=>unit.id!==victim.id&&hexDistance(victim,unit)<=1);
          for(const nearby of foes){const splash=damageTarget(nearby,Math.max(1,Math.round(actor.atk*.25*scale)),actor,state.units);fxAt(nearby,'sweep');fxAt(nearby,'text',`-${splash}`);if(nearby.dead)triggerInkBurst(nearby);}
        }
        if(victim.dead){triggerInkBurst(victim);triggerKill(actor,state.units);}
        await wait(45);
      }
    }
  }
  renderUnits();await wait(90);return true;
}

function chargeDestination(actor,target,units,steps=2,blockedHexes=[]){
  const ghost={...actor};
  for(let index=0;index<steps;index+=1){const simulated=units.map(unit=>unit.id===actor.id?ghost:unit),step=nextStep(ghost,target,simulated,blockedHexes);if(sameHex(step,ghost))break;ghost.q=step.q;ghost.r=step.r;}
  return {q:ghost.q,r:ghost.r};
}
function spreadFireHexes(existing=[],origin=null){
  const valid=new Set(generateHexes().map(hexKey)),seeds=existing.length?existing:(origin?[hexKey(origin)]:[]),spread=new Set(seeds);
  seeds.forEach(key=>{const [q,r]=key.split(',').map(Number);NEIGHBORS.forEach(delta=>{const next=hexKey({q:q+delta.q,r:r+delta.r});if(valid.has(next))spread.add(next);});});
  if(origin)spread.add(hexKey(origin));return [...spread];
}

async function act(actor){
  if(actor.dead)return;
  if(activeFreezeRemaining(actor)>0){await wait(70);return;}
  maybeActivateEnemySkill(actor);
  if(actor.type==='watercurtain')return actWaterCurtainCave(actor);
  if(actor.type==='guanyin'&&actor.team==='player')return actGuanyinGuest(actor);
  if(actor.type==='tang'||actor.type==='falsetang')return actTangSanzang(actor);
  if(actor.atk<=0)return;
  if(actor.partySkills?.includes('heavyanchor')&&adjacentUnits(actor,state.units).length>=2)actor.disrupted=0;
  if(actor.disrupted>0){actor.disrupted-=1;showStunFx(actor,'STAGGERED');setCopy(`${actor.name} loses this action.`);await wait(90);return;}
  actor.turns+=1;
  const recallSkill=actor.partySkills?.includes('bajiereturn')?'bajiereturn':actor.partySkills?.includes('wujingreturn')?'wujingreturn':null,recallDestination=recallSkill&&actor.turns%3===0?returnToTangDestination(actor,state.units,state.blockedHexes):null;
  if(recallDestination){actor.q=recallDestination.q;actor.r=recallDestination.r;actor.moved=true;renderUnits();fxAt(actor,'gold-ring');fxAt(actor,'text','RETURN');setCopy(`${PARTY_SKILL_LOOKUP[recallSkill].name}: ${actor.name} returns beside Tang Sanzang.`);await wait(140);return;}
  if(actor.partySkills?.includes('rakebrace')&&actor.turns%3===0){const tang=living(state.units,actor.team).find(unit=>partyOwnerForUnit(unit)==='tang'&&hexDistance(actor,unit)<=1);if(tang){actor.ward=Math.max(1,actor.ward);tang.ward=Math.max(1,tang.ward);fxAt(actor,'gold-ring');fxAt(tang,'gold-ring');fxAt(actor,'text','RAKE BRACE');}}
  if(actor.partySkills?.includes('guardcircle')&&actor.turns%3===0){const guarded=adjacentUnits(actor,state.units);guarded.forEach(ally=>{ally.ward=Math.max(1,ally.ward);fxAt(ally,'gold-ring');});fxAt(actor,'text','GUARD CIRCLE');}
  if(actor.partySkills?.includes('crowdbreaker')&&!actor.specialUsed){const crowd=living(state.units,actor.team==='player'?'enemy':'player').filter(foe=>hexDistance(actor,foe)<=1);if(crowd.length>=2){actor.specialUsed=true;crowd.forEach(foe=>{foe.disrupted=Math.max(1,foe.disrupted);showStunFx(foe,'STAGGERED');});fxAt(actor,'sweep');setCopy(`Crowd Breaker staggers ${crowd.length} surrounding enemies.`);await wait(120);return;}}
  if(pagodaMusterReady(actor)){summonPagodaSoldiers(actor);await wait(180);return;}
  if(actor.type==='bonespirit'&&actor.turns%3===0&&actor.specialCount<2&&summonBoneGuard(actor)){await wait(150);return;}
  let target=selectTarget(actor,state.units);if(!target)return;let distance=hexDistance(actor,target);const erlangSpear=erlangSpearReady(actor),houndPounce=houndPounceReady(actor),bullCharge=actor.type==='bulldemon'&&actor.turns%3===0&&distance>1;
  if(actor.type==='heavenlyhound'&&actor.openingUsed&&houndPounceReady(actor))return performBacklinePounce(actor,target);
  if(actor.type==='skyhorn'&&!actor.openingUsed)return performBacklinePounce(actor,target,'BACKLINE DESCENT',.8,true);
  if(actor.traits.includes('somersault')&&distance>1&&distance<=3&&actor.turns%3===0)return performLeapAttack(actor,target);
  if(bullCharge){const landing=chargeDestination(actor,target,state.units,2,state.blockedHexes),moved=!sameHex(actor,landing);actor.q=landing.q;actor.r=landing.r;actor.moved=actor.moved||moved;actor.chargeReady=true;renderUnits();unitMotionFx(actor,'bull-rush',720);fxAt(actor,'charge-dust','',800);fxAt(target,'charge-warning','',800);setCopy('Mountain-Shaking Charge: the Bull Demon King rushes two Hexes toward his prey.');await wait(180);distance=hexDistance(actor,target);}
  const effectiveRange=Math.max(attackRangeFor(actor),erlangSpear?4:0,houndPounce?3:0);
  if(distance>effectiveRange){const step=nextStep(actor,target,state.units,state.blockedHexes),moved=!sameHex(actor,step);actor.q=step.q;actor.r=step.r;actor.moved=actor.moved||moved;if(moved&&actor.partySkills?.includes('cloudstep'))actor.chargeReady=true;if(moved&&actor.partySkills?.includes('charge'))actor.chargeReady=true;if(moved&&actor.partySkills?.includes('movingwall'))adjacentUnits(actor,state.units).forEach(ally=>{ally.ward=Math.max(1,ally.ward);fxAt(ally,'gold-ring');});if(moved&&['riverstep','cloudescort'].some(skill=>actor.partySkills?.includes(skill))){const ally=adjacentUnits(actor,state.units).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(ally){ally.ward=Math.max(1,ally.ward);fxAt(ally,'gold-ring');fxAt(actor,'text',actor.partySkills.includes('cloudescort')?'CLOUD ESCORT':'RIVER STEP');}}renderUnits();setCopy(`${actor.name} advances.`);await wait(state.waterHexes.includes(hexKey(actor))?140:90);return;}
  if(partyOwnerForUnit(target)==='tang'&&target.partySkills?.includes('horseguard')&&!target.specialUsed&&distance<=1){target.specialUsed=true;actor.disrupted=Math.max(1,actor.disrupted);fxAt(target,'gold-ring');showStunFx(actor,'DRAGON REBUFF');setCopy('White Dragon Horse drives back the first adjacent attacker.');await wait(100);return;}
  if(houndFlurryReady(actor))return performHoundFlurry(actor,target);
  if(ruyiThrowReady(actor))return performRuyiThrow(actor,target);
  const wukongSweep=sweepReady(actor),rakeSweep=rakeSweepReady(actor),sweeping=wukongSweep||rakeSweep,focused=focusedStrikeReady(actor),staffLine=staffLineReady(actor);actor.attacks+=1;let damage=Math.round(actor.atk*formationAttackMultiplier(actor,state.units));
  if(actor.chargeReady){actor.chargeReady=false;damage=Math.round(damage*1.3);fxAt(actor,'text',actor.type==='bulldemon'?'MOUNTAIN CHARGE':actor.partySkills.includes('charge')?'CHARGE':'CLOUD STEP');}
  if(actor.partySkills?.includes('steadyhand'))damage=Math.round(damage*(1+Math.min(3,adjacentUnits(actor,state.units).length)*.15));
  if(actor.partySkills?.includes('goldengaze')&&target.kind.includes('boss')&&!target.exposed){target.exposed=true;damage=Math.round(damage*1.4);fxAt(target,'third-eye');fxAt(target,'text','EXPOSED');setCopy('Golden Gaze sees through the boss and exposes its true body.');}
  if(actor.type==='wolfspirit'&&living(state.units,actor.team).some(ally=>ally.type==='wolfspirit'&&ally.id!==actor.id&&hexDistance(ally,target)<=1))damage=Math.round(damage*1.25);
  if(sweeping){damage=Math.round(damage*.7);fxAt(target,'sweep');fxAt(target,'text','横扫');if(wukongSweep)activateTrait(actor,'sweep',`${actor.name} sends Sweeping Arc across the target area.`);else setCopy(`${actor.name} swings Rake Sweep through the target area.`);}
  else if(actor.traits.includes('cloudstaff')&&distance>actor.range){damage=Math.round(damage*.75);activateTrait(actor,'cloudstaff','Cloud-Sweeping Staff carries the strike across the Arena.');fxAt(target,'beam');}
  else if(focused){damage=Math.round(damage*1.8);fxAt(target,'slash');fxAt(target,'text','FOCUS');setCopy(`${actor.name} concentrates the third strike on one target.`);}
  if(actor.type==='lijing'&&actor.attacks%3===0){damage=Math.round(damage*1.4);fxBetween(actor,target,'pagoda-ray',800);fxAt(target,'seal-grid','',900);fxAt(target,'text','PAGODA SEAL');setCopy('Pagoda Seal presses a golden command grid onto its target.');}
  if(actor.type==='erlang'&&actor.attacks%3===0){damage=Math.round(damage*2.1);fxBetween(actor,target,'third-eye-beam',900);fxAt(target,'third-eye','',1000);fxAt(target,'text','TRUE SIGHT');setCopy('True Sight finds the original Wukong. The Third Eye breaks through disguise.');}
  if(erlangSpear){fxBetween(actor,target,'sky-spear',900);fxAt(target,'spear-burst','',850);fxAt(target,'text','SKY SPEAR');}
  if(houndPounce){fxBetween(actor,target,'hound-arc',700);fxAt(target,'claw-ring','',800);fxAt(actor,'text','MOON POUNCE');}
  if(actor.traits.includes('relentless')&&actor.attacks%4===0){damage*=2;activateTrait(actor,'relentless',`Relentless: the fourth strike lands twice.`);}
  journeyAttackFx(actor,target);const dealt=damageTarget(target,damage,actor,state.units);await animateAttack(actor,target,dealt);setCopy(`${actor.name} strikes ${target.name} for ${dealt}.`);triggerVigilance(target,actor);
  if(bodyFixingReady(actor)&&!target.dead){target.disrupted=Math.max(1,target.disrupted);showStunFx(target);setCopy(`Body-Fixing Spell (定身法) freezes ${target.name}'s next action.`);}
  if(erlangSpear){const pierced=ruyiLineTargets(actor,target,state.units).find(unit=>unit.id!==target.id&&!unit.dead);if(pierced){const spearDamage=damageTarget(pierced,Math.round(actor.atk*.7),actor,state.units);fxBetween(target,pierced,'sky-spear',800);fxAt(pierced,'spear-burst','',800);fxAt(pierced,'text',`-${spearDamage}`);setCopy(`Sky Spear pierces ${target.name} and ${pierced.name}.`);}}
  if(staffLine){const pierced=ruyiLineTargets(actor,target,state.units).find(unit=>unit.id!==target.id&&!unit.dead);if(pierced){const lineDamage=damageTarget(pierced,Math.round(actor.atk*.65),actor,state.units);fxBetween(target,pierced,'sky-spear',650);fxAt(pierced,'text',`-${lineDamage}`);setCopy('Crescent Line passes through a second enemy.');}}
  if(actor.type==='heavenlyhound'&&target.id==='true-wukong'&&!target.dead){const erlang=state.units.find(unit=>unit.type==='erlang'&&!unit.dead);if(erlang)erlang.specialTarget=target.id;fxBetween(actor,target,'scent-line',750);fxAt(target,'scent-mark','',1000);if(!actor.specialUsed){actor.specialUsed=true;target.disrupted=Math.max(1,target.disrupted);showStunFx(target,'HOUND LOCK');setCopy('Xiaotian Quan marks the known Sun Wukong for Erlang Shen. His next action is lost.');}}
  if(sweeping){const opposingTeam=actor.team==='player'?'enemy':'player';const splash=living(state.units,opposingTeam).filter(other=>other.id!==target.id&&hexDistance(target,other)<=1);for(const other of splash){const splashDamage=damageTarget(other,Math.round(actor.atk*.7),actor,state.units);fxAt(other,'sweep');fxAt(other,'text',`-${splashDamage}`);}setCopy(`Sweeping Arc (横扫) cuts through ${splash.length+1} ${splash.length?'foes':'foe'}.`);}
  if(actor.partySkills?.includes('backswing')&&actor.attacks%4===0){const rear=living(state.units,actor.team==='player'?'enemy':'player').filter(other=>other.id!==target.id&&hexDistance(target,other)<=1).sort((a,b)=>hexDistance(actor,b)-hexDistance(actor,a))[0];if(rear){const rearDamage=damageTarget(rear,Math.round(actor.atk*.8),actor,state.units);fxAt(rear,'sweep');fxAt(rear,'text',`-${rearDamage}`);}}
  if(actor.partySkills?.includes('countercurrent')&&actor.attacks%4===0){const guarded=adjacentUnits(actor,state.units).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(guarded)living(state.units,actor.team==='player'?'enemy':'player').filter(foe=>hexDistance(foe,guarded)<=1&&foe.id!==target.id).forEach(foe=>{const counter=damageTarget(foe,Math.round(actor.atk*.6),actor,state.units);fxAt(foe,'text',`-${counter}`);});}
  if(actor.partySkills?.includes('riverrepulse')&&actor.attacks%3===0&&!target.dead){const origin={q:target.q,r:target.r},destination=pushAwayFrom(actor,target,state.units,2,state.blockedHexes),pushed=hexDistance(origin,destination);target.q=destination.q;target.r=destination.r;target.moved=pushed>0||target.moved;renderUnits();showKnockbackFx(target,origin,destination,`KNOCKBACK ${pushed}`,'water');setCopy(pushed?`River Repulse (流沙退潮) drives ${target.name} back ${pushed} ${pushed===1?'Hex':'Hexes'}.`:`River Repulse strikes, but ${target.name} has no open Hex behind it.`);await wait(220);}
  if(actor.type==='yellowwind'&&actor.attacks%3===0){target.disrupted=Math.max(1,target.disrupted);showStunFx(target,'');living(state.units,target.team).filter(unit=>unit.id!==target.id&&hexDistance(unit,target)<=1).forEach(unit=>{const wind=damageTarget(unit,Math.round(actor.atk*.5),actor,state.units);fxAt(unit,'wind-vortex','',900);fxAt(unit,'text',`-${wind}`);});fxAt(target,'storm-ring','',1050);fxAt(target,'text','SAMADHI WIND');}
  if(actor.type==='redboy'&&actor.attacks%3===0){fxBetween(actor,target,'samadhi-line',1000);state.burningHexes=spreadFireHexes(state.burningHexes,target);renderHexes();state.burningHexes.forEach(key=>{const [q,r]=key.split(',').map(Number);fxAt({q,r},'living-flame','',1200);});living(state.units,target.team).filter(unit=>unit.id!==target.id&&state.burningHexes.includes(hexKey(unit))).forEach(unit=>{const fire=damageTarget(unit,Math.round(actor.atk*.45),actor,state.units);fxAt(unit,'flame-burst','',900);fxAt(unit,'text',`-${fire} BURN`);});fxAt(target,'text','FIRE SPREADS');setCopy(`Spreading Samadhi Fire now burns ${state.burningHexes.length} Hexes.`);}
  if(actor.type==='bulldemon'&&actor.attacks%3===0){target.disrupted=Math.max(1,target.disrupted);showStunFx(target,'STAGGERED');living(state.units,target.team).filter(unit=>unit.id!==target.id&&hexDistance(unit,target)<=1).forEach(unit=>{const shock=damageTarget(unit,Math.round(actor.atk*.6),actor,state.units);fxAt(unit,'earth-hit','',900);fxAt(unit,'text',`-${shock} SHOCK`);});fxAt(target,'quake-ring','',1050);}
  if(actor.partySkills?.includes('longrake')&&distance===2&&!target.dead){const step=nextStep(target,actor,state.units,state.blockedHexes);target.q=step.q;target.r=step.r;fxAt(target,'text','PULL');}
  if(actor.partySkills?.includes('lastmeal')&&actor.hp/actor.maxHp<.5)healTarget(actor,8);
  if(target.hp<=0){target.dead=true;setCopy(`${target.name} falls.`);triggerInkBurst(target);triggerKill(actor,state.units);}
  renderUnits();await wait(70);
}
async function actTangSanzang(actor){
  actor.turns+=1;
  if(banishingVerseReady(actor)){const adjacentFoes=living(state.units,actor.team==='player'?'enemy':'player').filter(foe=>hexDistance(actor,foe)<=1);if(adjacentFoes.length){const moves=[];adjacentFoes.forEach(foe=>{const origin={q:foe.q,r:foe.r},destination=pushAwayFrom(actor,foe,state.units,2,state.blockedHexes);foe.q=destination.q;foe.r=destination.r;foe.moved=true;moves.push({foe,origin,destination});});fxAt(actor,'gold-ring');renderUnits();moves.forEach(({foe,origin,destination})=>showKnockbackFx(foe,origin,destination,'EXPELLED','force'));setCopy(`Banishing Verse (逐妖经) drives ${adjacentFoes.length} nearby ${adjacentFoes.length===1?'enemy':'enemies'} away.`);await wait(260);return;}}
  const objective=selectSupportObjective(actor,state.units);if(!objective){await wait(40);return;}if(actor.partySkills.includes('pilgrimcall')&&actor.turns%4===0){const recalled=living(state.units,actor.team).filter(unit=>unit.id!==actor.id&&unit.hp<unit.maxHp).sort((a,b)=>hexDistance(actor,b)-hexDistance(actor,a))[0];if(recalled){const step=nextStep(recalled,actor,state.units,state.blockedHexes);if(!sameHex(step,recalled)){recalled.q=step.q;recalled.r=step.r;recalled.moved=true;renderUnits();fxBetween(actor,recalled,'gold-thread',700);fxAt(recalled,'text','CALLED CLOSER');await wait(110);}}}let target=hexDistance(actor,objective)<=supportRangeFor(actor)?objective:null,moved=false;
  if(!target){const step=supportStep(actor,objective,state.units,state.blockedHexes);moved=!sameHex(actor,step);actor.q=step.q;actor.r=step.r;actor.moved=actor.moved||moved;if(moved){renderUnits();setCopy(`${actor.name} moves toward ${objective.name} to bring them within prayer range.`);await wait(90);}target=hexDistance(actor,objective)<=supportRangeFor(actor)?objective:null;if(!target)return;}
  const base=actor.partySkills.includes('compassion')?28:18,rangePenalty=actor.partySkills.includes('deepprayer')?4:0,healed=healTarget(target,Math.max(1,base-rangePenalty)),healerName=actor.team==='player'?'Tang Sanzang':"Tang Sanzang's Echo",targetName=target.name;
  if(actor.partySkills.includes('chainprayer')){const second=living(state.units,actor.team).filter(unit=>unit.id!==actor.id&&unit.id!==target.id&&unit.hp<unit.maxHp&&hexDistance(unit,target)<=1).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(second)healTarget(second,9);}
  if(actor.partySkills.includes('sutracircle'))adjacentUnits(actor,state.units).filter(unit=>unit.hp<unit.maxHp).forEach(unit=>healTarget(unit,8));
  if(actor.partySkills.includes('stillness')&&actor.turns%3===0)adjacentUnits(actor,state.units).forEach(unit=>{unit.ward=Math.max(1,unit.ward);fxAt(unit,'gold-ring');});
  setCopy(`${healerName} ${moved?'moves into range and':'holds position and'} restores ${healed} HP to ${targetName}.`);renderUnits();await wait(120);
}
function battleWon(){return !living(state.units,'enemy').length;}
function missionRequiresTang(battle){return Boolean(battle.journeyBattle||battle.partyBattle||battle.id==='unchosen');}
function battleLost(units=state.units,battle=BATTLES[state.scene]){const alive=living(units,'player').filter(unit=>unit.type!=='hairdecoy'&&unit.type!=='hairclone');if(missionRequiresTang(battle))return !alive.some(unit=>unit.id==='true-tang');return battle.id==='unchosen'||battle.partyBattle?!alive.length:!alive.some(unit=>unit.id==='true-wukong');}
function storyPartyFallen(){return !living(state.units,'player').filter(unit=>unit.type!=='hairdecoy'&&unit.type!=='hairclone').length;}
function wukongFallen(units){return units.some(unit=>unit.type.includes('wukong')&&unit.dead);}
function hexRadius(cell){return Math.max(Math.abs(cell.q),Math.abs(cell.r),Math.abs(-cell.q-cell.r));}
function birthBurstRing(distance){return NEIGHBORS.map(direction=>({q:direction.q*distance,r:direction.r*distance}));}
function stepTowardCenter(unit,units){
  if(unit.q===0&&unit.r===0)return {q:0,r:0};
  const occupiedByNonSummon=new Set(units.filter(other=>!other.dead&&other.id!==unit.id&&!['hairclone','hairdecoy'].includes(other.type)).map(hexKey));
  return NEIGHBORS.map(delta=>({q:unit.q+delta.q,r:unit.r+delta.r})).filter(cell=>isValidHex(cell)&&hexRadius(cell)<hexRadius(unit)&&!occupiedByNonSummon.has(hexKey(cell))).sort((a,b)=>hexRadius(a)-hexRadius(b)||a.r-b.r||a.q-b.q)[0]||{q:unit.q,r:unit.r};
}
function mythicSummonsOnHexes(units,hexes){const keys=new Set(hexes);return units.filter(unit=>!unit.dead&&['hairclone','hairdecoy'].includes(unit.type)&&keys.has(hexKey(unit)));}
function pulseBoth(label){state.units.filter(unit=>unit.type.includes('wukong')).forEach(unit=>{fxAt(unit,'ring');fxAt(unit,'text',label);});}
function pulseAuthority(label){state.units.filter(unit=>unit.authority).forEach(unit=>{const node=$(`unit-${unit.id}`);node?.classList.add('authority-active');fxAt(unit,'ring');});setCopy(label);setTimeout(()=>state.units.filter(unit=>unit.authority).forEach(unit=>$(`unit-${unit.id}`)?.classList.remove('authority-active')),900);}
async function runTightFilletTrial(){
  const wukongs=state.units.filter(unit=>unit.type.includes('wukong')&&!unit.dead),duration=3600;wukongs.forEach(unit=>{unit.tightFilletUntil=Date.now()+duration;unit.activeFrozenUntil=Date.now()+duration;});renderUnits();
  pulseAuthority('Guanyin begins the Tight-Fillet Chant. Both crowns answer.');arenaFx('tight-fillet-chant',duration);wukongs.forEach(unit=>{showStunFx(unit,'BOUND');fxAt(unit,'fillet-ring','',duration);});
  for(let tick=1;tick<=4;tick+=1){await wait(650);for(const unit of wukongs){const pain=Math.min(12,Math.max(0,unit.hp-1));unit.hp-=pain;fxAt(unit,'pain-pulse','',620);fxAt(unit,'text',`-${pain} PAIN`,620);}renderUnits();setCopy(tick<4?'The same cry. The same pain. Neither body yields the truth.':'Guanyin hears no difference between them.');}
  await wait(500);wukongs.forEach(unit=>{unit.tightFilletUntil=0;unit.activeFrozenUntil=0;});renderUnits();pulseAuthority('Guanyin releases the spell before pain becomes judgment.');await wait(500);
}
function forceInside(radius){
  const occupied=new Set();
  for(const unit of state.units.filter(entry=>!entry.dead)){
    if(hexRadius(unit)<=radius&&!occupied.has(hexKey(unit))){occupied.add(hexKey(unit));continue;}
    const destination=generateHexes(radius).filter(cell=>!occupied.has(hexKey(cell))).sort((a,b)=>hexDistance(unit,a)-hexDistance(unit,b)||a.r-b.r||a.q-b.q)[0];
    if(destination){unit.q=destination.q;unit.r=destination.r;occupied.add(hexKey(destination));}
  }
  renderUnits();
}
async function revealFalseParty(){
  setCopy('“Wukong…?”');await wait(1400);
  state.units.forEach(unit=>{if(unit.team==='enemy')unit.hidden=false;});
  $('arena').classList.remove('fogged');renderUnits();setCopy('The clouds withdraw. An entire echo pilgrimage stands behind him.');addChronicle('The echo pilgrimage reveals itself.');await wait(900);
}
async function scriptedDuelMemory(){
  const rejected=state.discardedTraits[0],falseOne=state.units.find(unit=>unit.id==='false-wukong');if(!falseOne)return;
  if(rejected==='vigilance'){setCopy('A hidden archer looses one last arrow.');falseOne.hp-=1;renderUnits();await wait(450);falseOne.vigilanceUsed=true;falseOne.specialTarget='true-wukong';activateTrait(falseOne,'vigilance','Vigilance — the discarded instinct answers inside him.');await wait(850);}
}
async function runAuthorityTest(battle){
  if(battle.id==='guanyin'){
    $('battle-status').textContent='GUANYIN OBSERVES';
    for(let exchange=0;exchange<2;exchange+=1){const actors=[...living(state.units,'player'),...living(state.units,'enemy')].sort((a,b)=>b.speed-a.speed||a.id.localeCompare(b.id));for(const actor of actors){await act(actor);if(wukongFallen(state.units))return finishAuthorityTest('guanyin',true);}}
    $('battle-status').textContent='TIGHT-FILLET CHANT';await runTightFilletTrial();return finishAuthorityTest('guanyin');
  }
  const started=Date.now(),flags={mirror:false,sealOne:false,sealTwo:false};
  const duration=14000;
  while(Date.now()-started<duration){
    const elapsed=Date.now()-started;
    $('battle-status').textContent=`${battle.id==='guanyin'?'CHANT':'MIRROR'} ${Math.max(0,Math.ceil((duration-elapsed)/1000))}s`;
    if(elapsed>=3500&&!flags.mirror){flags.mirror=true;$('arena').classList.add('heaven-mirror');setCopy('The Heavenly Mirror returns two identical reflections.');await wait(900);$('arena').classList.remove('heaven-mirror');}
    if(elapsed>=7000&&!flags.sealOne){flags.sealOne=true;pulseAuthority('The 18 Heavenly Soldiers lock the outer ring.');await wait(700);}
    if(elapsed>=11000&&!flags.sealTwo){flags.sealTwo=true;pulseAuthority('The encirclement holds. Neither Wukong may leave.');await wait(700);}
    const actors=[...living(state.units,'player'),...living(state.units,'enemy')].sort((a,b)=>b.speed-a.speed||a.id.localeCompare(b.id));
    for(const actor of actors){await act(actor);if(wukongFallen(state.units))return finishAuthorityTest(battle.id,true);}
  }
  finishAuthorityTest(battle.id);
}
function spawnUnderworldWave(count,wave){
  const candidates=wave===1?[{q:-2,r:0},{q:2,r:-2}]:wave===2?[{q:-3,r:0},{q:3,r:-3}]:[{q:-3,r:1},{q:3,r:-2},{q:0,r:-3}];
  const occupied=new Set(state.units.filter(unit=>!unit.dead).map(hexKey));
  const cells=[...candidates,...generateHexes().filter(cell=>cell.r<=0)].filter(cell=>!occupied.has(hexKey(cell))).slice(0,count);
  cells.forEach((cell,index)=>state.units.push(makeUnit('underworld',`underworld-${wave}-${index+1}`,'enemy',cell.q,cell.r)));
  renderUnits();setCopy(`Wave ${wave}: ${cells.length} Yin-court Wardens enter the Arena.`);fxAt(state.units.find(unit=>unit.id==='diting'),'ring');
}
function ditingSecondsRemaining(elapsed){return Math.max(0,Math.ceil((25000-elapsed)/1000));}
async function runDitingBattle(){
  const started=Date.now(),flags={waveOne:false,waveTwo:false,waveThree:false,heardOne:false,heardTwo:false,heardThree:false};
  while(Date.now()-started<25000){
    const elapsed=Date.now()-started;
    if(elapsed>=5000&&!flags.waveOne){flags.waveOne=true;spawnUnderworldWave(DITING_WAVE_COUNTS[0],1);}
    if(elapsed>=8000&&!flags.heardOne){flags.heardOne=true;setCopy('Diting: “This is no ordinary transformation...”');}
    if(elapsed>=11000&&!flags.waveTwo){flags.waveTwo=true;spawnUnderworldWave(DITING_WAVE_COUNTS[1],2);}
    if(elapsed>=16000&&!flags.heardTwo){flags.heardTwo=true;setCopy('Diting: “I can hear what others cannot.”');}
    if(elapsed>=17000&&!flags.waveThree){flags.waveThree=true;spawnUnderworldWave(DITING_WAVE_COUNTS[2],3);}
    if(elapsed>=24000&&!flags.heardThree){flags.heardThree=true;setCopy('Diting: “I know which is true... but I cannot say.”');}
    $('battle-status').textContent=`OBSERVE ${ditingSecondsRemaining(elapsed)}s`;
    const actors=[...living(state.units,'player'),...living(state.units,'enemy')].sort((a,b)=>b.speed-a.speed||a.id.localeCompare(b.id));
    for(const actor of actors){await act(actor);const witness=state.units.find(unit=>unit.id==='diting');if(witness.dead)return finishDitingDefeat();}
    await wait(40);
  }
  finishDitingVictory();
}
function finishPreludeSequence(status,copy,chronicle){
  state.phase='resolved';state.locked=false;renderTraits();$('battle-status').textContent=status;$('battle-status').className='battle-status victory';setCopy(copy);addChronicle(chronicle);state.scene+=1;setTimeout(showStoryTransition,650);
}
async function runBirthSequence(){
  $('arena').classList.add('birth-scene');$('battle-status').textContent='AWAKENING';setCopy('The stone answers wind, cloud, and thunder.');
  const hero=state.units[0];for(let distance=1;distance<=RADIUS;distance+=1){state.radiantHexes=[...new Set(Array.from({length:distance},(_,index)=>birthBurstRing(index+1)).flat().map(hexKey))];renderHexes();fxAt(hero,'gold-ring');await wait(240);}await wait(180);hero.kind='wukong stone-monkey';hero.displayName='Stone Monkey (石猴)';hero.skill=UNIT_DEFINITIONS.wukong.skill;hero.skillCopy='Newborn from stone: wild, unarmored, and not yet the Great Sage.';renderUnits();fxAt(hero,'stone-birth');fxAt(hero,'text','STONE MONKEY');await wait(720);state.radiantHexes=[];renderHexes();$('arena').classList.remove('birth-scene');
  finishPreludeSequence('AWAKENED','The stone is empty. Sun Wukong stands in its place.','The Stone Monkey opens his eyes.');
}
async function runBuddhaSequence(){
  const hero=state.units.find(unit=>unit.id==='true-wukong'),buddha=state.units.find(unit=>unit.id==='buddha');
  $('arena').classList.add('buddha-closing');$('battle-status').textContent='MYTHIC LOADOUT';setCopy('Every Technique that broke Heaven remains in Wukong’s hands. He raises the Ruyi Jingu Bang.');await wait(500);
  for(const [index,radius] of [3,2,1].entries()){
    const inward=stepTowardCenter(hero,state.units),blockingSummons=mythicSummonsOnHexes(state.units,[hexKey(inward)]);blockingSummons.forEach(summon=>{fxAt(summon,'ink');fxAt(summon,'text','ERASED');summon.hp=0;summon.dead=true;});hero.q=inward.q;hero.r=inward.r;hero.moved=true;renderUnits();fxAt(hero,'gold-ring');fxAt(hero,'text','DRAWN INWARD');setCopy(`The Arena draws the Great Sage one Hex toward its center.`);await wait(260);
    hero.attacks+=1;if(index===0){fxAt(buddha,'sweep');fxAt(hero,'text','SWEEP + CLONES');}if(index===1){fxAt(buddha,'throw-staff');fxAt(buddha,'return-staff');fxAt(hero,'text','SPLIT RUYI');}if(index===2){fxAt(buddha,'beam');fxAt(hero,'text','CLOUD STAFF');}
    const dealt=damageTarget(buddha,Math.round(hero.atk*(index===2?2:1)));await animateAttack(hero,buddha,dealt,index===1?'RUYI: 0':'0 DAMAGE');setCopy(`Mythic combination ${index+1}: the Buddha's condition does not change.`);await wait(280);
    state.dangerousHexes=generateHexes().filter(cell=>hexRadius(cell)>=radius).map(hexKey);renderHexes();const erased=mythicSummonsOnHexes(state.units,state.dangerousHexes);erased.forEach(summon=>{fxAt(summon,'ink');fxAt(summon,'text','ERASED');summon.hp=0;summon.dead=true;});renderUnits();pulseAuthority(`Ring ${index+1} erases ${erased.length} false ${erased.length===1?'body':'bodies'}.`);await wait(650);
  }
  hero.q=0;hero.r=0;renderUnits();fxAt(hero,'gold-ring');fxAt(hero,'text','CENTER');await wait(180);
  $('battle-status').textContent='THE PALM DESCENDS';setMythicLandmark('palm');await wait(1450);$('arena').classList.add('palm-impact');fxAt(hero,'text','SEALED',1500);await wait(650);$('arena').classList.remove('buddha-closing','palm-impact');setMythicLandmark('mountain-forming');await wait(850);setMythicLandmark('mountain');
  finishPreludeSequence('FIVE ELEMENTS','No position escapes the Buddha’s Palm. Five Elements Mountain falls.','Wukong is sealed beneath Five Elements Mountain.');
}
async function runMountainSequence(){
  $('battle-status').textContent='FIVE HUNDRED YEARS';setCopy('Spring. Summer. Autumn. Winter. The mountain does not move.');await wait(850);
  const tang=state.units.find(unit=>unit.id==='true-tang'),hero=state.units.find(unit=>unit.id==='true-wukong');unitMotionFx(tang,'sutra-chant',1500);setMythicLandmark('mountain-chanting');fxAt(tang,'sutra','唵',1450);fxAt(tang,'gold-ring');$('battle-status').textContent='TANG SANZANG CHANTS';setCopy('Tang Sanzang recites the releasing verse. The five seals answer one by one.');await wait(1150);setMythicLandmark('mountain-splitting');fxAt(hero,'rock-dust','',1100);fxAt(hero,'text','THE MOUNTAIN PARTS',1200);setCopy('The spell reaches the heart of the stone. Five Elements Mountain splits open around Sun Wukong.');await wait(1100);setMythicLandmark();hero.kind='wukong';hero.displayName=null;renderUnits();fxAt(hero,'ring');fxAt(hero,'text','FREE');await wait(650);
  state.pagodaDecoys=false;finishPreludeSequence('POWER LOST','The mountain opens, but five hundred years have scattered Sun Wukong’s old Techniques. Each victory will offer a choice—not a fixed recovery.','Tang Sanzang frees Sun Wukong. The pilgrimage must build its skills through choices.');
}
async function runBattle(){
  if(state.locked)return;const battle=BATTLES[state.scene];state.locked=true;state.phase='battle';$('primary-action').disabled=true;$('phase-label').textContent='AUTO BATTLE';$('phase-help').textContent=battle.battleHint;$('battle-status').textContent=battle.id==='false-party'?'SURVIVE 12s':battle.id==='guanyin'?'GUANYIN OBSERVES':battle.id==='heaven'?'MIRROR 14s':battle.id==='diting'?'OBSERVE 25s':battle.id==='unchosen'?'FINAL CLASH':'IN MOTION';$('battle-status').className='battle-status active';renderHexes();renderTraits();
  if(battle.sequence==='birth')return runBirthSequence();
  if(battle.sequence==='buddha')return runBuddhaSequence();
  if(battle.sequence==='mountain')return runMountainSequence();
  const storyBattle=BATTLES[state.scene].id==='false-party',storyStart=Date.now();
  if(storyBattle)await revealFalseParty();
  if(['guanyin','heaven'].includes(BATTLES[state.scene].id))return runAuthorityTest(BATTLES[state.scene]);
  if(BATTLES[state.scene].id==='diting')return runDitingBattle();
  const roundLimit=battle.id==='unchosen'?96:32;
  for(let round=1;round<=roundLimit;round+=1){state.round=round;
    if(storyBattle)$('battle-status').textContent=`SURVIVE ${Math.max(0,Math.ceil((12000-(Date.now()-storyStart))/1000))}s`;
    const actors=[...living(state.units,'player'),...living(state.units,'enemy')].sort((a,b)=>b.speed-a.speed||a.id.localeCompare(b.id));
    for(const actor of actors){await act(actor);if(battle.mysteryRetreat&&state.units.some(mysteryReadyToRetreat))return finishMysteryRetreat();if(storyBattle?(storyPartyFallen()):((battleWon()||battleLost())))break;}
    if(storyBattle&&(storyPartyFallen()||battleWon()||Date.now()-storyStart>=12000))return finishRetreat();
    if(battle.id==='duel'&&!state.sixEaredColorRevealed&&(round>=2&&state.units.some(unit=>unit.id==='false-wukong'&&unit.attacks>0)||state.units.some(unit=>unit.type.includes('wukong')&&unit.hp<=unit.maxHp*.5))){
      const falseOne=state.units.find(unit=>unit.id==='false-wukong');
      if(falseOne){const revealUnits=state.units;await revealSixEaredColor(falseOne);if(state.units!==revealUnits||state.phase!=='battle'||BATTLES[state.scene]!==battle)return;await scriptedDuelMemory();state.traitReveal=state.discardedTraits[0];renderTraits();}
    }
    if(BATTLES[state.scene].id==='duel'&&(round>=8||state.units.some(unit=>unit.type.includes('wukong')&&unit.hp<=unit.maxHp*.5))){return finishDuel();}
    if(!storyBattle&&battleWon())return finishVictory();if(!storyBattle&&battleLost())return finishDefeat();
  }
  if(battle.mysteryRetreat)return finishDefeat();
  return BATTLES[state.scene].id==='duel'?finishDuel():finishVictory();
}
async function finishMysteryRetreat(){
  const battle=BATTLES[state.scene],stranger=state.units.find(unit=>unit.type==='mysterywukong');recordBattleClear(battle);state.phase='resolved';state.locked=false;$('battle-status').textContent='ESCAPING';$('battle-status').className='battle-status victory';setCopy('The stranger breaks away at one-quarter strength. No one saw the face beneath the hood.');addChronicle('A hooded stranger escapes after using the skills Sun Wukong rejected.');renderUnits();if(stranger){fxAt(stranger,'ink');fxAt(stranger,'text','ESCAPES');await wait(650);stranger.hidden=true;renderUnits();}$('ending-title').textContent='Why did he know those moves?';document.querySelector('.recognition-line').textContent='Sun Wukong: “I refused those paths. How did a stranger learn them?”';$('ending-summary').innerHTML='<p><b>Tang Sanzang:</b> “A choice may leave your hands without leaving the world.”</p><p><b>Sha Wujing:</b> “We never saw his face. We only know he carried what you cast aside.”</p><p><b>Zhu Bajie:</b> “Then next time, we pull back the hood.”</p>';$('ending-restart').textContent='CHOOSE WHAT THIS BATTLE CHANGES';endingAction=()=>{$('ending-dialog').close();openJourneyChoice(battle,0);};setTimeout(()=>$('ending-dialog').showModal(),350);
}
function finishVictory(){const battle=BATTLES[state.scene];if(battle.id==='unchosen')return finishCampaign();recordBattleClear(battle);state.phase='resolved';state.locked=false;$('battle-status').textContent='VICTORY';$('battle-status').className='battle-status victory';setCopy('The battlefield falls silent. The road continues.');addChronicle(`${battle.title} is won.`);if(battle.id==='pagoda-army'){state.pagodaDecoys=true;addChronicle('Sun Wukong learns Plucked-Hair Decoys: four empty doubles will face Xiaotian Quan.');}if(battle.rewardOwners){setTimeout(()=>openJourneyChoice(battle,0),650);return;}if(battle.choiceAfter===false){state.scene+=1;setTimeout(showStoryTransition,700);return;}setTimeout(openChoice,700);}
function openRetryDialog(title,line,summary){renderTraits();$('ending-title').textContent=title;document.querySelector('.recognition-line').textContent=line;$('ending-summary').innerHTML=summary;$('ending-restart').textContent='RETURN TO FORMATION';endingAction=()=>{$('ending-dialog').close();setupBattle();};setTimeout(()=>$('ending-dialog').showModal(),500);}
function finishDefeat(){recordBattleFailure();state.phase='resolved';state.locked=false;$('battle-status').textContent='DEFEAT';$('battle-status').className='battle-status';const battle=BATTLES[state.scene],tangFell=missionRequiresTang(battle)&&!living(state.units,'player').some(unit=>unit.id==='true-tang'),copy=tangFell?'Tang Sanzang falls. Without the scripture bearer, the Journey West fails.':'The formation falls, but the same road can be attempted again.';setCopy(copy);openRetryDialog(tangFell?'The scripture road breaks.':'The formation breaks.','Reposition. Keep every skill and choice.',battle.id==='unchosen'?'Return to Formation with the same <b>Chosen</b> and <b>Discarded</b> Traits. Change where the four pilgrims stand, then face the history you made again.':'Return to this battle’s Formation with the same party, skills, choices, and story progress. Change the deployment, then try again.');}
function finishRetreat(){recordBattleClear(BATTLES[state.scene]);state.phase='resolved';state.locked=false;$('battle-status').textContent='FORCED RETREAT';$('battle-status').className='battle-status';setCopy('The true pilgrimage collapses. This defeat is the road forward.');addChronicle('Without Wukong, the true pilgrimage is driven from the field.');state.scene=BATTLES.findIndex(battle=>battle.id==='duel');setTimeout(showStoryTransition,800);}
function finishDuel(){recordBattleClear(BATTLES[state.scene]);state.phase='resolved';state.locked=false;state.traitReveal=state.discardedTraits[0];$('battle-status').textContent='INTERRUPTED';$('battle-status').className='battle-status victory';renderTraits();setCopy('The two staffs stop. The movement is unmistakable.');addChronicle(`The Other Wukong reveals ${TRAITS[state.discardedTraits[0]].name}.`);setTimeout(()=>{const t=TRAITS[state.discardedTraits[0]];$('ending-title').textContent='“That move…”';document.querySelector('.recognition-line').textContent='He fights with what I left behind.';$('ending-summary').innerHTML=`You chose <b>${TRAITS[state.chosenTraits[0]].name}</b>. The mind you rejected—<b>${t.name} (${t.cn})</b>—returned in another body.`;$('ending-restart').textContent='CONTINUE TO GUANYIN';endingAction=()=>{$('ending-dialog').close();state.scene=BATTLES.findIndex(battle=>battle.id==='guanyin');showStoryTransition();};$('ending-dialog').showModal();},800);}
function finishAuthorityTest(id,endedByFall=false){
  recordBattleClear(BATTLES[state.scene]);state.phase='resolved';state.locked=false;$('battle-status').textContent='NO VERDICT';$('battle-status').className='battle-status victory';
  if(id==='guanyin'){
    setCopy(endedByFall?'One Wukong falls. Guanyin refuses to turn defeat into proof.':'Guanyin stops the spell. Both Wukongs bore the same binding and the same pain.');
    addChronicle(endedByFall?'Guanyin refuses to call a defeated body false.':'The Tight-Fillet Chant hurts both Wukongs alike. Guanyin reaches no verdict.');
    setTimeout(()=>{$('ending-title').textContent='The spell cannot name him.';document.querySelector('.recognition-line').textContent='Guanyin: “Both crowns answered. Both hearts endured.”';$('ending-summary').innerHTML='<p>The Tight-Fillet Chant bound both Wukongs, stopped both bodies, and drained them at the same pace.</p><p>Guanyin ends the pain herself. A shared curse proves that both carry Wukong\'s memory—but it cannot prove which one is true.</p><p>Unable to judge the two monkeys, Guanyin chooses to help the pilgrims investigate the false road instead.</p>';$('ending-restart').textContent='ACCEPT GUANYIN\'S HELP';endingAction=()=>{$('ending-dialog').close();openChoice();};$('ending-dialog').showModal();},650);return;
  }
  setCopy(endedByFall?'One Wukong falls. Heaven stops the duel: mortality is not a verdict.':'The Heavenly Court lowers its weapons. The mirror gives no verdict.');addChronicle(endedByFall?'The Heavenly Court witnesses defeat but still cannot judge identity.':'Eighteen Heavenly Soldiers contained the duel, but Heaven found no difference.');setTimeout(openChoice,700);
}
function finishDitingDefeat(){recordBattleFailure();state.phase='resolved';state.locked=false;$('battle-status').textContent='WITNESS LOST';$('battle-status').className='battle-status';setCopy('Diting falls before the truth can be spoken. Reform the protection line and try again.');addChronicle('The Underworld silences the witness.');openRetryDialog('The witness falls.','Reposition before the Underworld returns.','Return to this battle’s Formation with the same party, skills, choices, and story progress. Protect Diting with a different deployment.');}
function finishDitingVictory(){recordBattleClear(BATTLES[state.scene]);state.phase='resolved';state.locked=false;$('battle-status').textContent='TRUTH HEARD';$('battle-status').className='battle-status victory';setCopy('The Diting completes the observation, then refuses to speak.');addChronicle('Diting knows the truth but will not name it.');$('ending-title').textContent='The Diting knows.';$('ending-summary').innerHTML='Diting heard the difference—but will not decide the journey for either mind. The complete echo pilgrimage now waits on the road above.';document.querySelector('.recognition-line').textContent='“I know. I cannot say.”';$('ending-restart').textContent='FACE THE UNCHOSEN';endingAction=()=>{$('ending-dialog').close();state.scene=BATTLES.findIndex(battle=>battle.id==='unchosen');showStoryTransition();};setTimeout(()=>$('ending-dialog').showModal(),700);}
function openJourneyReport(completed=false){renderTraits();const report=buildJourneyReport(state,completed);$('ending-title').textContent=report.title;document.querySelector('.recognition-line').textContent=report.line;$('ending-summary').innerHTML=report.markup;$('ending-restart').textContent='BEGIN ANOTHER JOURNEY';endingAction=()=>{$('ending-dialog').close();restartJourney();};$('ending-dialog').showModal();}
function abandonJourney(){if(combatTimer)clearTimeout(combatTimer);state.phase='resolved';state.locked=false;openJourneyReport(false);}
function finishCampaign(){recordBattleClear(BATTLES[state.scene]);state.phase='resolved';state.locked=false;$('battle-status').textContent='ROAD CLAIMED';$('battle-status').className='battle-status victory';setCopy('The echo pilgrimage falls. No authority chose the victor.');addChronicle('The chosen history defeats the unchosen road.');setTimeout(()=>openJourneyReport(true),700);}

function openJourneyChoice(battle,ownerIndex=0){
  renderTraits();
  const owner=battle.rewardOwners[ownerIndex],pair=partySkillPairFor(state,owner),character=PARTY_SKILLS[owner];if(pair.length<2){if(ownerIndex<battle.rewardOwners.length-1)return openJourneyChoice(battle,ownerIndex+1);state.scene+=1;showStoryTransition();return;}
  $('choice-title').textContent=`${ownerIndex+1}/4 · What changes in ${character.name}?`;
  $('choice-copy').textContent='Choose one of two unseen skills. Then the next pilgrim chooses. The rejected skill belongs to the other pilgrimage.';
  $('choice-options').innerHTML=pair.map(id=>{const skill=PARTY_SKILL_LOOKUP[id];return `<button class="choice-card" data-journey-choice="${id}"><span class="sigil">${skill.sigil}</span><h3>${skill.name}</h3><span class="cn">${skill.cn}</span><p>${skill.short}</p></button>`;}).join('');
  document.querySelectorAll('[data-journey-choice]').forEach(button=>button.onclick=()=>resolveJourneyChoice(battle,ownerIndex,button.dataset.journeyChoice,pair));if(!$('choice-dialog').open)$('choice-dialog').showModal();
}
function resolveJourneyChoice(battle,ownerIndex,chosen,pair){
  const owner=battle.rewardOwners[ownerIndex];
  const rejected=pair.find(id=>id!==chosen),skill=PARTY_SKILL_LOOKUP[chosen],character=PARTY_SKILLS[owner];if(!choosePartySkill(state,owner,chosen,rejected))return;
  addChronicle(`${character.name} chooses ${skill.name}; ${PARTY_SKILL_LOOKUP[rejected].name} takes the other road.`);if(ownerIndex<battle.rewardOwners.length-1){openJourneyChoice(battle,ownerIndex+1);return;}
  $('choice-dialog').close();state.scene+=1;state.phase='formation';state.locked=false;showStoryTransition();
}

function openChoice(){
  renderTraits();
  const pair=traitPairFor(state);if(pair.length<2){state.scene+=1;showStoryTransition();return;}$('choice-title').textContent='Which power becomes yours?';$('choice-copy').textContent='One instinct takes root. The other disappears into ink.';$('choice-options').innerHTML=pair.map(id=>{const t=TRAITS[id];return `<button class="choice-card" data-choice="${id}"><span class="sigil">${t.sigil}</span><h3>${t.name}</h3><span class="cn">${t.cn}</span><p>${t.short}</p></button>`;}).join('');
  document.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>resolveChoice(button.dataset.choice,pair));$('choice-dialog').showModal();
}
function resolveChoice(chosen,pair){const rejected=pair.find(id=>id!==chosen);chooseTrait(state,chosen,rejected);$('choice-dialog').close();addChronicle(`${TRAITS[chosen].name} becomes part of Wukong.`);state.scene+=1;state.phase='formation';state.locked=false;showStoryTransition();}
function showStoryTransition(){
  const battle=BATTLES[state.scene],id=battle.id;
  if(id==='havoc'){$('story-dialog-kicker').textContent='ACT I · SUN WUKONG';$('story-dialog-title').textContent='Heaven tries to contain one impossible monkey.';$('story-dialog-copy').innerHTML='<p>Sun Wukong enters with a temporary <b>Mythic Loadout</b>: double, leap, long staff, split throw, double throw, return strike, and sweep.</p><p>This battle previews the power ceiling. Position him, then watch the rules combine.</p>';$('story-dialog-action').textContent='MAKE HAVOC';}
  else if(id==='pagoda-army'){$('story-dialog-kicker').textContent='HEAVEN ANSWERS WITH ORDER';$('story-dialog-title').textContent='Li Jing lowers his tower.';$('story-dialog-copy').innerHTML='<p>Heaven no longer sends a crowd. Li Jing arranges soldiers, generals, shields, and archers into one command.</p><p><i>“They have a place for every creature. I became the Great Sage because their place was too small.”</i></p>';$('story-dialog-action').textContent='BREAK THE FORMATION';}
  else if(id==='erlang-hunt'){$('story-dialog-kicker').textContent='PLUCKED-HAIR DECOYS · 毫毛阵';$('story-dialog-title').textContent='Four empty doubles run before the hound.';$('story-dialog-copy').innerHTML='<p>Defeating Li Jing unlocks <b>Plucked-Hair Decoys</b> for this hunt. Sun Wukong begins with four fragile non-attacking bodies.</p><p>Xiaotian Quan mauls one target up to five times and hunts first—but a Decoy can intercept it. Erlang Shen enters with three layers of Battle Mirror Ward, True Sight, and a stronger piercing Sky Spear.</p>';$('story-dialog-action').textContent='FACE ERLANG SHEN';}
  else if(id==='buddha-palm'){$('story-dialog-kicker').textContent='THE NOISE STOPS';$('story-dialog-title').textContent='The Buddha enters the Arena.';$('story-dialog-copy').innerHTML='<p>Nothing has been taken from Wukong. His full Mythic Loadout, combat clone, and Hair Decoys remain on the board after Erlang falls.</p><p>Choose where Wukong begins. Then spend Heaven-breaking power against the Buddha and learn what strength cannot change.</p><p><i>“If I cannot break this cage, I must learn whether freedom is only the power to break.”</i></p>';$('story-dialog-action').textContent='ENTER WITH FULL POWER';}
  else if(id==='mountain-opens'){$('story-dialog-kicker').textContent='FIVE HUNDRED YEARS';$('story-dialog-title').textContent='A monk reaches Five Elements Mountain.';$('story-dialog-copy').innerHTML='<p>Seasons pass beyond counting. Tang Sanzang removes the seal and offers Sun Wukong a place on the Journey West.</p>';$('story-dialog-action').textContent='OPEN THE MOUNTAIN';}
  else if(id==='black-wind'){$('story-dialog-kicker').textContent='ACT II · THE PILGRIMS GATHER';$('story-dialog-title').textContent='Defeat the enemy. Protect the scripture bearer.';$('story-dialog-copy').innerHTML='<p>White Dragon becomes Tang Sanzang’s mount—not a separate fighter. Zhu Bajie joins at Gao Village; Sha Wujing joins at the Flowing Sands River.</p><p><b>Primary objective:</b> defeat every enemy. <b>Pilgrimage condition:</b> Tang Sanzang’s death fails the mission. Sun Wukong may fall without ending the battle; the surviving pilgrims continue while Tang Sanzang lives. Bosses pursue him but must strike any pilgrim physically blocking their route; minions attack the nearest member of the group.</p><p>The board only marks immediate ally benefits: green Heal, blue Shield, and gold Attack Buff Hexes. Attack and control ranges stay off the grid.</p><p>Each of the next six <b>Party Growth</b> battles gives all four pilgrims a Two Minds choice.</p>';$('story-dialog-action').textContent='ENTER BLACK WIND RIDGE';}
  else if(id==='yellow-wind'){$('story-dialog-kicker').textContent='ACT II · PARTY GROWTH 02';$('story-dialog-title').textContent='The whole pilgrimage learns after every battle.';$('story-dialog-copy').innerHTML='<p>All four pilgrims made a choice at Black Wind Ridge. Yellow Wind Pass will produce four more pairs—one pair for each character, with no repeated card.</p>';$('story-dialog-action').textContent='FACE THE YELLOW WIND';}
  else if(id==='white-bone'){$('story-dialog-kicker').textContent='ACT II · THE MISSING DISCIPLE';$('story-dialog-title').textContent='One familiar weapon faces the wrong way.';$('story-dialog-copy').innerHTML='<p>White Bone Spirit has bewitched Zhu Bajie. Sha Wujing remains beside Sun Wukong and mounted Tang Sanzang.</p><p>Protect the master, defeat the possessed Zhu Bajie, and break the spell without abandoning your formation.</p>';$('story-dialog-action').textContent='BRING ZHU BAJIE BACK';}
  else if(id==='hooded-echo'){$('story-dialog-kicker').textContent='ACT II · PARTY GROWTH 04';$('story-dialog-title').textContent='A black hood waits where the road narrows.';$('story-dialog-copy').innerHTML='<p>The stranger’s face cannot be read. The troubling clue is the fighting style: every movement resembles a skill Sun Wukong saw, understood, and deliberately refused.</p><p>Reduce the stranger to <b>25% HP</b> while Tang Sanzang survives. The stranger will flee, but the whole party will still learn from the encounter.</p>';$('story-dialog-action').textContent='FACE THE HOODED STRANGER';}
  else if(id==='fire-cloud'){$('story-dialog-kicker').textContent='ACT II · PARTY GROWTH 05';$('story-dialog-title').textContent='The restored party enters true fire.';$('story-dialog-copy').innerHTML='<p>The hooded stranger knew techniques Wukong never chose, then escaped without showing a face. The question follows the pilgrims into Red Boy’s fire.</p><p>Defeating Red Boy gives another non-repeating pair to every pilgrim.</p>';$('story-dialog-action').textContent='CROSS FIRE CLOUD RAVINE';}
  else if(id==='bull-demon-gate'){$('story-dialog-kicker').textContent='ACT II · PARTY GROWTH 06';$('story-dialog-title').textContent='The Bull Demon King blocks the road west.';$('story-dialog-copy').innerHTML='<p>Red Boy’s fire has gone out, but his father has heard of the defeat. The Bull Demon King brings two iron guards and three raiders who descend directly onto the last row.</p><p>Each pilgrim has already made five decisions. This final road battle gives all four characters their sixth pair and completes both possible party builds.</p>';$('story-dialog-action').textContent='FACE THE BULL DEMON KING';}
  else if(id==='bandits'){$('story-dialog-kicker').textContent='ACT III · TWO MINDS';$('story-dialog-title').textContent='The road remembers every rejected skill.';$('story-dialog-copy').innerHTML='<p>Five trials built a party through choices rather than a fixed upgrade list. Each pilgrim carries what was chosen; another pilgrimage is quietly inheriting what was rejected.</p><p>Now cutthroats block the road. Sun Wukong can end the danger—but Tang Sanzang will remember how he uses strength.</p>';$('story-dialog-action').textContent='ENTER THE PASS';}
  else if(id==='false-party'){$('story-dialog-kicker').textContent='SUN WUKONG IS GONE';$('story-dialog-title').textContent='The pilgrimage continues without its strongest disciple.';$('story-dialog-copy').innerHTML='<p>Tang Sanzang, Zhu Bajie, and Sha Wujing reach a clouded pass. A familiar staff waits on the enemy side.</p><p>This is a story battle: survive as long as you can. Defeat advances the journey.</p>';$('story-dialog-action').textContent='MEET THE STRANGER';}
  else if(id==='duel'){$('story-dialog-kicker').textContent='NEWS REACHES WUKONG';$('story-dialog-title').textContent='Another Wukong has taken his place.';$('story-dialog-copy').innerHTML='<p>The true pilgrimage was beaten by copies wearing their own faces. Wukong returns to confront the figure carrying his abandoned mind.</p>';$('story-dialog-action').textContent='FACE THE OTHER';}
  else if(id==='guanyin'){$('story-dialog-kicker').textContent='AN IMPARTIAL WITNESS';$('story-dialog-title').textContent='Guanyin tests the two crowns.';$('story-dialog-copy').innerHTML='<p>Guanyin sits upon her lotus and lets the duel begin. Then she will sustain the <b>Tight-Fillet Chant</b> over both Wukongs at once.</p><p>Both will be bound. Both will lose HP slowly. If one suffers differently, the spell may reveal the truth.</p>';$('story-dialog-action').textContent='SUBMIT TO THE TEST';}
  else if(id==='empty-seat'){$('story-dialog-kicker').textContent='GUANYIN JOINS THE FORMATION';$('story-dialog-title').textContent='A counterfeit birthplace feeds an echo pilgrimage.';$('story-dialog-copy').innerHTML='<p>The spell gave no verdict, so Guanyin follows the imitation road herself. She temporarily joins Tang Sanzang, Zhu Bajie, and Sha Wujing as a fourth controllable unit.</p><p><b>Counterfeit Water Curtain:</b> a targetable Spawner that creates two weak Cave-Born Mimics every other turn. The flow stops only when the Cave falls.</p><p><b>Lotus Protection:</b> allies within two Hexes deal 25% more damage and take 25% less. Every third turn, <b>Holy Light</b> strikes an enemy cluster and heals allies inside the Lotus.</p>';$('story-dialog-action').textContent='DESTROY THE COUNTERFEIT CAVE';}
  else if(id==='heaven'){$('story-dialog-kicker').textContent='HEAVENLY SUMMONS';$('story-dialog-title').textContent='Eighteen soldiers close the road.';$('story-dialog-copy').innerHTML='<p>Heavenly Soldiers occupy every outer-ring Hex as real blocking units. The two Wukongs must duel inside while the Heavenly Mirror watches.</p>';$('story-dialog-action').textContent='ENTER THE ENCIRCLEMENT';}
  else if(id==='diting'){$('story-dialog-kicker').textContent='THE WITNESS BELOW';$('story-dialog-title').textContent='Diting asks for twenty-five seconds.';$('story-dialog-copy').innerHTML='<p>Ox-Head and Horse-Face already flank Six-Eared Macaque. Wukong, Bajie, and Wujing must protect Diting as three larger waves of Yin-court Wardens close in.</p><p>This is no duel: formation and target priority decide whether truth survives.</p>';$('story-dialog-action').textContent='PROTECT THE WITNESS';}
  else if(id==='unchosen'){$('story-dialog-kicker').textContent='THE FINAL ROAD';$('story-dialog-title').textContent='The complete echo pilgrimage waits.';$('story-dialog-copy').innerHTML='<p>No authority remains. Your four pilgrims carry every Chosen Trait; their four echoes carry the Discarded history.</p><p><b>Win:</b> defeat all four echoes. <b>Lose:</b> all four pilgrims fall. Repositioning is allowed; past choices cannot be changed.</p>';$('story-dialog-action').textContent='FACE THE UNCHOSEN';}
  else{$('story-dialog-kicker').textContent=battle.chapter;$('story-dialog-title').textContent=battle.title;$('story-dialog-copy').innerHTML=`<p>${battle.story}</p>`;$('story-dialog-action').textContent='CONTINUE';}
  storyAction=()=>{setupBattle();$('story-dialog').close();};$('story-dialog').showModal();renderTraits();
}
function setupBattle(){const battle=BATTLES[state.scene];state.round=0;state.phase='formation';state.locked=false;state.traitReveal=['guanyin','empty-seat','heaven','diting','unchosen'].includes(battle.id)?state.discardedTraits[0]:null;state.waterHexes=[];state.dangerousHexes=[];state.radiantHexes=battle.id==='stone-birth'?birthBurstRing(1).map(hexKey):[];state.blockedHexes=[];selectedDeploymentId=null;hoveredAuraOwnerId=null;state.units=createBattleUnits(state);$('arena').classList.toggle('fogged',battle.id==='false-party');$('arena').classList.toggle('mountain-scene',battle.id==='mountain-opens');$('arena').classList.remove('heaven-mirror','birth-scene','buddha-closing','palm-impact');setMythicLandmark(battle.id==='mountain-opens'?'mountain':'');$('primary-action').disabled=false;$('primary-action').textContent=battle.id==='stone-birth'?'AWAKEN':battle.id==='buddha-palm'?'CHALLENGE THE BUDDHA':battle.id==='mountain-opens'?'BEGIN THE JOURNEY':battle.journeyBattle?'BEGIN JOURNEY BATTLE':battle.id==='duel'?'BEGIN THE DUEL':battle.id==='false-party'?'ENDURE THE ATTACK':battle.id==='guanyin'?'BEGIN THE CHANT TEST':battle.partyBattle?'BEGIN TEAM BATTLE':battle.id==='heaven'?'FACE HEAVEN':battle.id==='diting'?'BEGIN OBSERVATION':battle.id==='unchosen'?'BEGIN FINAL BATTLE':'BEGIN BATTLE';$('phase-label').textContent=battle.id==='buddha-palm'?'FORMATION':battle.sequence?'STORY SCENE':battle.deploy?'FORMATION':'RECOGNITION';$('phase-help').textContent=battle.formationHint;$('battle-status').textContent='READY';$('battle-status').className='battle-status';setCopy(battle.objective);renderAll();}
function opening(){setupBattle();$('story-dialog-kicker').textContent='ACT I · SUN WUKONG';$('story-dialog-title').textContent='Before the journey, the stone opens.';$('story-dialog-copy').innerHTML='<p>On Mount Huaguo, a stone egg gathers wind, cloud, and the breath of the world.</p><p>This short playable prelude begins Sun Wukong’s story before Two Minds divides it.</p>';$('story-dialog-action').textContent='SEE THE STONE';storyAction=()=>$('story-dialog').close();$('story-dialog').showModal();}
function createJourneyRestartState(){const run=createRunState();run.scene=BATTLES.findIndex(battle=>battle.id==='mountain-opens');run.chronicle=['Five hundred years pass beneath Five Elements Mountain.'];return run;}
function resetRun(){if(combatTimer)clearTimeout(combatTimer);combatTimer=null;state=createRunState();opening();}
function restartJourney(){if(combatTimer)clearTimeout(combatTimer);combatTimer=null;state=createJourneyRestartState();setupBattle();showStoryTransition();}
function handleJourneyAction(){if(journeyHasBegun(state)){abandonJourney();return;}restartJourney();}

if(hasDOM){
  $('primary-action').onclick=runBattle;$('abandon-button').onclick=handleJourneyAction;$('story-dialog-action').onclick=()=>storyAction?.();$('ending-restart').onclick=()=>endingAction?.();endingAction=()=>{$('ending-dialog').close();resetRun();};opening();
}

if(typeof module!=='undefined')module.exports={RADIUS,DEPLOYMENT_HEXES,PARTY_DEPLOYMENT_HEXES,DEFAULT_PARTY_FORMATION,DITING_OPENING_GUARDS,DITING_WAVE_COUNTS,MYTHIC_TECHNIQUES,JOURNEY_REWARD_OWNERS,PARTY_SKILLS,PARTY_SKILL_LOOKUP,TECHNIQUES,TRAITS,TRAIT_ORDER,UNIT_DEFINITIONS,BATTLES,generateHexes,hexDistance,hexRadius,isValidHex,isDeploymentHex,deploymentCellsForBattle,placeUnit,partyPosition,rememberPartyFormation,rememberHairDecoyFormation,mountainVariant,createRunState,createJourneyRestartState,chooseTrait,choosePartySkill,partySkillPairFor,makeUnit,partyOwnerForUnit,applyPartyBuild,applyOpeningPartySkills,buildFalseWukong,addOpeningTraitUnits,createBattleUnits,nextStep,chargeDestination,spreadFireHexes,pushAwayFrom,tidalWavePlacements,returnToTangDestination,lastRowLanding,journeyHasBegun,journeyActionLabel,recordBattleClear,recordBattleFailure,recordUnitFall,skillNamesForReport,buildJourneyReport,birthBurstRing,stepTowardCenter,mythicSummonsOnHexes,journeyEnemySvgMarkup,ditingSvgMarkup,underworldGuardSvgMarkup,figureMarkup,sixEaredIsVeiled,selectTarget,selectSupportTarget,selectSupportObjective,supportStep,supportRangeFor,adjacentUnits,formationDamageMultiplier,cellsWithin,positionalAuraSpecs,auraMapForUnits,visibleAuraEffects,auraEffectMarkup,missionRequiresTang,battleLost,usesWukongKit,hasTechnique,ruyiThrowReady,ruyiLineTargets,sweepReady,rakeSweepReady,staffLineReady,bodyFixingReady,banishingVerseReady,focusedStrikeReady,pagodaMusterReady,erlangSpearReady,houndPounceReady,houndFlurryReady,attackRangeFor,traitPairFor,ditingSecondsRemaining,damageTarget,healTarget,activeFreezeRemaining,activeSkillCanUse,mysteryRetreatThreshold,mysteryReadyToRetreat,settleHealth,living,wukongFallen};
