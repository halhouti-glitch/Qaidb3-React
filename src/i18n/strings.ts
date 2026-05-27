export type Lang = 'en' | 'ar';

export type Strings = {
  title: string;
  language: string;
  gameSetup: string;
  numPlayersLabel: string;
  thresholdLabel: string;
  winCondLabel: string;
  lowestWins: string;
  highestWins: string;
  setPlayers: string;
  playerNames: string;
  playerDefault: string;
  startGame: string;
  standings: string;
  thPlayer: string;
  thTotal: string;
  thRoundsPlayed: string;
  thToThreshold: string;
  dealerBadge: string;
  winnerBadge: string;
  enterRound: string;
  enterRoundSuffix: string;
  saveRound: string;
  undoRound: string;
  resetGame: string;
  roundHistory: string;
  thRound: string;
  thDealerAfter: string;
  infoHighest: (t: number) => string;
  infoLowest: (t: number) => string;
  winnerBanner: (name: string, total: number) => string;
  confirmUndo: string;
  confirmReset: string;
  thActions: string;
  editBtn: string;
  deleteBtn: string;
  saveBtn: string;
  cancelBtn: string;
  editingRoundLabel: (n: number) => string;
  confirmDelete: (n: number) => string;
  minusBtn: string;
  clearPlayers: string;
  confirmClearPlayers: string;
  gameType: string;
  gameCustom: string;
  gameSebeeta: string;
  gameKout: string;
  teamA: string;
  teamB: string;
  teamAFull: string;
  teamBFull: string;
  teamLabel: string;
  thTeam: string;
  teamTotal: string;
  teamUneven: (a: number, b: number) => string;
  teamWinnerBanner: (name: string) => string;
  sebeetaHint: string;
  koutHint: string;
  contractMode: string;
  manualMode: string;
  callerLabel: string;
  levelLabel: string;
  outcomeLabel: string;
  levelBab: string;
  levelBawan: string;
  levelMalzoom: string;
  outcomeMade: string;
  outcomeFailed: string;
  contractHint: string;
  homePickGame: string;
  homeTitle: string;
  homeSub: string;
  gameSebeetaDesc: string;
  gameSebeetaMeta: string;
  gameKoutDesc: string;
  gameKoutMeta: string;
  gameCustomDesc: string;
  gameCustomMeta: string;
  resumeGame: string;
  recentGames: string;
  roundLabel: string;
  recordRound: string;
  matchComplete: string;
  newGame: string;
  goHome: string;
  goBack: string;
  finalScore: string;
  roundsPlayed: (n: number) => string;
  entryStylePlusMinus: string;
  entryStyleNumpad: string;
  manualEntry: string;
  prevPlayer: string;
  nextPlayer: string;
  themeToggle: string;
  themeLight: string;
  themeDark: string;

  // ── New keys for the redesign ────────────────────────────────
  homeEyebrow: string;
  homeHeadingPre: string;
  homeHeadingEm: string;
  homeHeadingPost: string;

  setupFormat: string;
  setupIndividuals: string;
  setupTeamsFormat: string;
  setupTeamsEvenHint: string;
  setupPlayersLabel: string;
  setupPlayToLabel: string;
  setupTargetCustom: string;
  setupPoints: string;
  setupRosterPartners: string;
  setupWinConditionLabel: string;
  setupFirstToWins: string;
  setupFirstToLoses: string;
  setupHighestTakesIt: string;
  setupLowestTakesIt: string;
  setupTitleKout: string;
  setupTitleSebeeta: string;
  setupTitleCustom: string;
  setupPlayerPlaceholder: (n: number) => string;
  setupTeamNamePlaceholder: string;
  setupStart: string;

  playFirstToPre: string;
  playFirstToLosesPre: string;
  playFirstToLosesPost: string;
  playRoundPill: (n: number) => string;

  sheetPlayersHint: string;
  sheetRunning: (n: number) => string;
  sheetClear: string;
  sheetNext: string;
  sheetSave: string;
  sheetUpdate: string;
  sheetEditRound: (n: number) => string;
  sheetCancel: string;

  koutWhoCalled: string;
  koutContractLabel: string;
  koutResult: string;
  koutMade: string;
  koutFailed: string;
  koutThisRound: string;
  koutPickContract: string;
  koutLegendWin: string;
  koutLegendLose: string;
  koutTabContract: string;
  koutTabManual: string;
  koutManualLabel: string;
  koutManualNote: string;
  koutRunning: string;

  winnerComplete: string;
  winnerWonBy: string;
  winnerLowestWins: string;
  winnerFirstToFinish: string;
  winnerSubKout: (n: number) => string;
  winnerSubLowest: (n: number) => string;
  winnerSubFirst: (n: number) => string;
  winnerSubSebeetaTeam: (n: number) => string;
  winnerRounds: string;
  winnerMargin: string;
  winnerSpread: string;
  winnerTarget: string;
  winnerRematch: string;
  winnerBack: string;

  historyTitle: string;
  historyCount: (n: number) => string;
  historyTotals: string;
  historyEmpty: string;
  historyRoundLabel: (n: number) => string;
  historyTapHint: string;
  historyMade: string;
  historyFailed: string;
  historyManualTag: string;

  // ── Player profiles (PORT_FROM_VANILLA.md item 2) ────────────
  topPlayers: string;
  clearAll: string;
  profileGamesPlayed: string;
  profileWins: string;
  profileWinRate: string;
  profileLastPlayed: string;
  profileTopTeammate: string;
  profileTeammateOf: (n: string, c: number) => string;
  profileNeverPlayed: string;
  removePlayer: string;

  // ── Undo snackbar (PORT_FROM_VANILLA.md item 5) ──────────────
  undoToastMessage: string;
  undoBtn: string;

  // ── Share-as-PNG (PORT_FROM_VANILLA.md item 6) ───────────────
  shareTitle: string;
  shareError: string;
  finalStandings: string;
  shareBtn: string;

  // ── Haptics + sound (PORT_FROM_VANILLA.md item 7) ────────────
  soundToggle: string;
};

const en: Strings = {
  title: 'قيد بلوك 3',
  language: 'Language',
  gameSetup: 'Game Setup',
  numPlayersLabel: 'Number of players (2–6)',
  thresholdLabel: 'Points (Win/Loss)',
  winCondLabel: 'Win condition',
  lowestWins: 'Highest score loses',
  highestWins: 'Highest score wins',
  setPlayers: 'Done',
  playerNames: 'Player Names',
  playerDefault: 'Player',
  startGame: 'Start Game',
  standings: 'Standings',
  thPlayer: 'Player',
  thTotal: 'Total',
  thRoundsPlayed: 'Rounds',
  thToThreshold: 'To Win/Lose',
  dealerBadge: 'D',
  winnerBadge: 'Winner',
  enterRound: 'Enter Round',
  enterRoundSuffix: 'Scores',
  saveRound: 'Save Round',
  undoRound: 'Undo Last Round',
  resetGame: 'Reset Game',
  roundHistory: 'Round History',
  thRound: 'Round',
  thDealerAfter: 'Dealer',
  infoHighest: (t) => `Points to win: ${t} — first to reach wins; dealer is the lowest score.`,
  infoLowest: (t) => `Points to lose: ${t} — when anyone reaches it, lowest score wins; dealer is the highest score.`,
  winnerBanner: (n, t) => `🏆 ${n} wins with ${t} points!`,
  confirmUndo: 'Undo the last round?',
  confirmReset: 'Reset the game? Scores will be cleared but players stay.',
  thActions: 'Actions',
  editBtn: 'Edit',
  deleteBtn: 'Delete',
  saveBtn: 'Save',
  cancelBtn: 'Cancel',
  editingRoundLabel: (n) => `Editing Round ${n}`,
  confirmDelete: (n) => `Delete round ${n}? Totals will be recalculated.`,
  minusBtn: 'Minus (−10)',
  clearPlayers: 'New Game',
  confirmClearPlayers: 'Start a new game with new players? This ends the current game.',
  gameType: 'Game',
  gameCustom: 'Custom',
  gameSebeeta: 'Sebeeta',
  gameKout: 'Kout',
  teamA: 'A',
  teamB: 'B',
  teamAFull: 'Team Alif',
  teamBFull: 'Team Baa',
  teamLabel: 'Team',
  thTeam: 'Team',
  teamTotal: 'Team Total',
  teamUneven: (a, b) => `Each team must have 3 players (currently ${a} / ${b}).`,
  teamWinnerBanner: (n) => `🏆 ${n} wins!`,
  sebeetaHint: 'Sebeeta: 6 players in 2 teams of 3. Any individual score reaching 201 ends the game — the opposing team wins.',
  koutHint: 'Kout: 6 players in 2 teams of 3. Scores are entered per team. First team to 101 wins.',
  contractMode: 'Contract',
  manualMode: 'Manual',
  callerLabel: 'Caller',
  levelLabel: 'Level',
  outcomeLabel: 'Outcome',
  levelBab: 'Bab',
  levelBawan: 'Bawan',
  levelMalzoom: 'Malzoom',
  outcomeMade: 'Made it',
  outcomeFailed: 'Failed',
  contractHint: 'Pick caller, level, and outcome to compute the scores.',
  homePickGame: 'Pick a game',
  homeTitle: 'Keep score, fast.',
  homeSub: 'Three preset games — Sebeeta, Kout, and an open scorepad for everything else.',
  gameSebeetaDesc: 'Highest score loses. Six players in two teams of three. First to 201 ends the round.',
  gameSebeetaMeta: '6 players · 2 teams',
  gameKoutDesc: 'Contract-based. Partners across. First team to 101 wins.',
  gameKoutMeta: '6 players · 2 teams',
  gameCustomDesc: 'Open scorepad. 2–6 players, any target, your own rules.',
  gameCustomMeta: '2–6 players',
  resumeGame: 'Resume current game',
  recentGames: 'Recent games',
  roundLabel: 'Round',
  recordRound: 'Record round',
  matchComplete: 'Match complete',
  newGame: 'New Game',
  goHome: 'Home',
  goBack: 'Back',
  finalScore: 'Final score',
  roundsPlayed: (n) => `${n} round${n === 1 ? '' : 's'}`,
  entryStylePlusMinus: 'Bulk',
  entryStyleNumpad: 'Numpad',
  manualEntry: 'Manual entry',
  prevPlayer: 'Previous',
  nextPlayer: 'Next',
  themeToggle: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',

  homeEyebrow: 'Tonight',
  homeHeadingPre: 'Pick a ',
  homeHeadingEm: 'game',
  homeHeadingPost: '. Keep score, fast.',

  setupFormat: 'Format',
  setupIndividuals: 'Individuals',
  setupTeamsFormat: 'Teams',
  setupTeamsEvenHint: 'Teams need an even number of players.',
  setupPlayersLabel: 'Players',
  setupPlayToLabel: 'Play to',
  setupTargetCustom: 'Custom',
  setupPoints: 'pts',
  setupRosterPartners: 'Roster',
  setupWinConditionLabel: 'Win condition',
  setupFirstToWins: 'First to reach the target wins',
  setupFirstToLoses: 'First to reach the target loses',
  setupHighestTakesIt: 'Highest score takes it',
  setupLowestTakesIt: 'Lowest score takes it',
  setupTitleKout: 'Kout — set teams',
  setupTitleSebeeta: 'Sebeeta — set teams',
  setupTitleCustom: 'Custom game',
  setupPlayerPlaceholder: (n) => `Player ${n}`,
  setupTeamNamePlaceholder: 'Team name',
  setupStart: 'Start game',

  playFirstToPre: 'First to',
  playFirstToLosesPre: 'First to',
  playFirstToLosesPost: 'loses',
  playRoundPill: (n) => `Round ${n}`,

  sheetPlayersHint: 'Tap a player to focus',
  sheetRunning: (n) => `Running: ${n}`,
  sheetClear: 'CLR',
  sheetNext: 'Next',
  sheetSave: 'Save',
  sheetUpdate: 'Update',
  sheetEditRound: (n) => `Edit round ${n}`,
  sheetCancel: 'Cancel',

  koutWhoCalled: 'Who called',
  koutContractLabel: 'Contract',
  koutResult: 'Outcome',
  koutMade: 'Made',
  koutFailed: 'Failed',
  koutThisRound: 'This round',
  koutPickContract: 'Pick a contract',
  koutLegendWin: 'Made',
  koutLegendLose: 'Failed',
  koutTabContract: 'Contract',
  koutTabManual: 'Manual',
  koutManualLabel: 'Score per team',
  koutManualNote: 'Enter the score for each team directly.',
  koutRunning: 'Running',

  winnerComplete: 'Match complete',
  winnerWonBy: 'Won by',
  winnerLowestWins: 'Lowest wins',
  winnerFirstToFinish: 'First to finish',
  winnerSubKout: (n) => `Reached ${n} first.`,
  winnerSubLowest: (n) => `Finished on ${n}.`,
  winnerSubFirst: (n) => `First to ${n}.`,
  winnerSubSebeetaTeam: (n) => `Opponents pushed past ${n}.`,
  winnerRounds: 'Rounds',
  winnerMargin: 'Margin',
  winnerSpread: 'Spread',
  winnerTarget: 'Target',
  winnerRematch: 'Rematch',
  winnerBack: 'Back to home',

  historyTitle: 'History',
  historyCount: (n) => `${n} round${n === 1 ? '' : 's'}`,
  historyTotals: 'Totals',
  historyEmpty: 'No rounds recorded yet.',
  historyRoundLabel: (n) => `Round ${n}`,
  historyTapHint: 'Tap a round to edit',
  historyMade: 'Made',
  historyFailed: 'Failed',
  historyManualTag: 'Manual',

  topPlayers: 'Top players',
  clearAll: 'Clear',
  profileGamesPlayed: 'Games',
  profileWins: 'Wins',
  profileWinRate: 'Win rate',
  profileLastPlayed: 'Last played',
  profileTopTeammate: 'Top teammates',
  profileTeammateOf: (n, c) => `${n} · ${c}×`,
  profileNeverPlayed: 'No games yet',
  removePlayer: 'Remove player',

  undoToastMessage: 'Round saved',
  undoBtn: 'Undo',

  shareTitle: 'Qaid game summary',
  shareError: 'Could not share the image.',
  finalStandings: 'Final standings',
  shareBtn: 'Share',

  soundToggle: 'Sound',
};

const ar: Strings = {
  title: 'قيد بلوك 3',
  language: 'اللغة',
  gameSetup: 'إعدادات اللعبة',
  numPlayersLabel: 'عدد اللاعبين (2–6)',
  thresholdLabel: 'النقاط (للفوز/للخساره)',
  winCondLabel: 'طريقة الفوز',
  lowestWins: 'الأعلى نقاطًا يخسر',
  highestWins: 'الأعلى نقاطًا يفوز',
  setPlayers: 'تم',
  playerNames: 'أسماء اللاعبين',
  playerDefault: 'لاعب',
  startGame: 'وزع',
  standings: 'الترتيب',
  thPlayer: 'اللاعب',
  thTotal: 'المجموع',
  thRoundsPlayed: 'الجولات',
  thToThreshold: 'للفوز/للخساره',
  dealerBadge: 'ش',
  winnerBadge: 'الفائز',
  enterRound: 'قيد الجولة',
  enterRoundSuffix: '',
  saveRound: 'حفظ الجولة',
  undoRound: 'امسح اخر جولة',
  resetGame: 'داس جديد',
  roundHistory: 'القيد',
  thRound: 'الجولة',
  thDealerAfter: 'الشيال',
  infoHighest: (t) => `النقاط للفوز: ${t} — أول من يصل يفوز؛ والشيال هو صاحب أقل نقاط.`,
  infoLowest: (t) => `النقاط للخساره: ${t} — عند وصول أي لاعب يفوز صاحب أقل نقاط؛ والشيال هو صاحب أعلى نقاط.`,
  winnerBanner: (n, t) => `🏆 فاز ${n} برصيد ${t} نقطة!`,
  confirmUndo: 'مسح الجولة الأخيرة؟',
  confirmReset: 'داس جديد؟ سيتم مسح النقاط فقط واللاعبين باقين.',
  thActions: 'تعديل/مسح',
  editBtn: 'تعديل',
  deleteBtn: 'مسح',
  saveBtn: 'حفظ',
  cancelBtn: 'إلغاء',
  editingRoundLabel: (n) => `تعديل الجولة ${n}`,
  confirmDelete: (n) => `مسح الجولة ${n}؟ سيتم إعادة احتساب المجاميع.`,
  minusBtn: 'ماينس (−10)',
  clearPlayers: 'قيم جديد',
  confirmClearPlayers: 'بدء قيم جديد بلاعبين جدد؟ سيتم إنهاء اللعبة الحالية.',
  gameType: 'اللعبة',
  gameCustom: 'قيد مفتوح',
  gameSebeeta: 'سبيته',
  gameKout: 'كوت',
  teamA: 'أ',
  teamB: 'ب',
  teamAFull: 'فريق ألف',
  teamBFull: 'فريق باء',
  teamLabel: 'الفريق',
  thTeam: 'الفريق',
  teamTotal: 'مجموع الفريق',
  teamUneven: (a, b) => `كل فريق يجب أن يحتوي على 3 لاعبين (حالياً ${a} / ${b}).`,
  teamWinnerBanner: (n) => `🏆 فاز ${n}!`,
  sebeetaHint: 'سبيته: 6 لاعبين في فريقين كل فريق 3. عند وصول أي لاعب إلى 201 تنتهي اللعبة ويفوز الفريق الآخر.',
  koutHint: 'كوت: 6 لاعبين في فريقين كل فريق 3. النقاط تُدخل لكل فريق. أول فريق يصل إلى 101 يفوز.',
  contractMode: 'حكم',
  manualMode: 'يدوي',
  callerLabel: 'الحاكم',
  levelLabel: 'الحكمه',
  outcomeLabel: 'النتيجة',
  levelBab: 'باب',
  levelBawan: 'باون',
  levelMalzoom: 'ملزوم',
  outcomeMade: 'فوز',
  outcomeFailed: 'خساره',
  contractHint: 'اختر الحاكم والحكمه والنتيجة لحساب النقاط.',
  homePickGame: 'اختر اللعبة',
  homeTitle: 'قيد سريع، بدون لخبطه.',
  homeSub: 'ثلاث ألعاب جاهزة — سبيته، كوت، وقيد مفتوح لأي لعبة ثانية.',
  gameSebeetaDesc: 'الأعلى نقاطًا يخسر. 6 لاعبين في فريقين كل فريق 3. أول من يوصل 201 ينهي الجولة.',
  gameSebeetaMeta: '6 لاعبين · فريقين',
  gameKoutDesc: 'لعبة بالحكم. الشريك بالمقابل. أول فريق يوصل 101 يفوز.',
  gameKoutMeta: '6 لاعبين · فريقين',
  gameCustomDesc: 'قيد مفتوح. من 2 إلى 6 لاعبين، أي هدف، قواعدك أنت.',
  gameCustomMeta: '2 إلى 6 لاعبين',
  resumeGame: 'كمل اللعبة الحالية',
  recentGames: 'آخر الألعاب',
  roundLabel: 'الجولة',
  recordRound: 'سجل الجولة',
  matchComplete: 'انتهت اللعبة',
  newGame: 'قيم جديد',
  goHome: 'الرئيسية',
  goBack: 'رجوع',
  finalScore: 'النتيجة النهائية',
  roundsPlayed: (n) => `${n} ${n === 1 ? 'جولة' : 'جولات'}`,
  entryStylePlusMinus: 'جملة',
  entryStyleNumpad: 'مفرق',
  manualEntry: 'إدخال يدوي',
  prevPlayer: 'السابق',
  nextPlayer: 'التالي',
  themeToggle: 'الوضع',
  themeLight: 'فاتح',
  themeDark: 'داكن',

  homeEyebrow: 'الليلة',
  homeHeadingPre: 'اختر ',
  homeHeadingEm: 'لعبة',
  homeHeadingPost: '. قيد سريع، بدون لخبطه.',

  setupFormat: 'الشكل',
  setupIndividuals: 'فردي',
  setupTeamsFormat: 'فرق',
  setupTeamsEvenHint: 'الفرق تحتاج عدد زوجي من اللاعبين.',
  setupPlayersLabel: 'اللاعبون',
  setupPlayToLabel: 'حتى',
  setupTargetCustom: 'مخصص',
  setupPoints: 'نقطة',
  setupRosterPartners: 'الفرق',
  setupWinConditionLabel: 'طريقة الفوز',
  setupFirstToWins: 'أول من يصل يفوز',
  setupFirstToLoses: 'أول من يصل يخسر',
  setupHighestTakesIt: 'الأعلى يفوز',
  setupLowestTakesIt: 'الأقل يفوز',
  setupTitleKout: 'إعداد كوت',
  setupTitleSebeeta: 'إعداد سبيته',
  setupTitleCustom: 'قيد مفتوح',
  setupPlayerPlaceholder: (n) => `لاعب ${n}`,
  setupTeamNamePlaceholder: 'اسم الفريق',
  setupStart: 'وزع',

  playFirstToPre: 'حتى',
  playFirstToLosesPre: 'حتى',
  playFirstToLosesPost: 'يخسر',
  playRoundPill: (n) => `الجولة ${n}`,

  sheetPlayersHint: 'انقر اللاعب للتركيز',
  sheetRunning: (n) => `حتى الآن: ${n}`,
  sheetClear: 'مسح',
  sheetNext: 'التالي',
  sheetSave: 'حفظ',
  sheetUpdate: 'تحديث',
  sheetEditRound: (n) => `تعديل الجولة ${n}`,
  sheetCancel: 'إلغاء',

  koutWhoCalled: 'من حكم',
  koutContractLabel: 'الحكم',
  koutResult: 'النتيجة',
  koutMade: 'فاز',
  koutFailed: 'خسر',
  koutThisRound: 'هذه الجولة',
  koutPickContract: 'اختر الحكم',
  koutLegendWin: 'فاز',
  koutLegendLose: 'خسر',
  koutTabContract: 'حكم',
  koutTabManual: 'يدوي',
  koutManualLabel: 'النقاط لكل فريق',
  koutManualNote: 'أدخل النقاط لكل فريق مباشرة.',
  koutRunning: 'حتى الآن',

  winnerComplete: 'انتهت اللعبة',
  winnerWonBy: 'فاز',
  winnerLowestWins: 'الأقل يفوز',
  winnerFirstToFinish: 'أول من ينتهي',
  winnerSubKout: (n) => `أول من وصل ${n}.`,
  winnerSubLowest: (n) => `انتهى عند ${n}.`,
  winnerSubFirst: (n) => `أول من يصل ${n}.`,
  winnerSubSebeetaTeam: (n) => `الخصوم تجاوزوا ${n}.`,
  winnerRounds: 'الجولات',
  winnerMargin: 'الفارق',
  winnerSpread: 'الفارق',
  winnerTarget: 'الهدف',
  winnerRematch: 'لعبة جديدة',
  winnerBack: 'الرئيسية',

  historyTitle: 'القيد',
  historyCount: (n) => `${n} ${n === 1 ? 'جولة' : 'جولات'}`,
  historyTotals: 'المجاميع',
  historyEmpty: 'لا توجد جولات بعد.',
  historyRoundLabel: (n) => `الجولة ${n}`,
  historyTapHint: 'انقر الجولة للتعديل',
  historyMade: 'فاز',
  historyFailed: 'خسر',
  historyManualTag: 'يدوي',

  topPlayers: 'أبرز اللاعبين',
  clearAll: 'مسح',
  profileGamesPlayed: 'الألعاب',
  profileWins: 'الفوز',
  profileWinRate: 'نسبة الفوز',
  profileLastPlayed: 'آخر لعبة',
  profileTopTeammate: 'الشركاء الأكثر',
  profileTeammateOf: (n, c) => `${n} · ${c}×`,
  profileNeverPlayed: 'لا توجد ألعاب بعد',
  removePlayer: 'حذف اللاعب',

  undoToastMessage: 'تم حفظ الجولة',
  undoBtn: 'تراجع',

  shareTitle: 'ملخص لعبة قيد',
  shareError: 'تعذرت مشاركة الصورة.',
  finalStandings: 'الترتيب النهائي',
  shareBtn: 'مشاركة',

  soundToggle: 'الصوت',
};

export const STRINGS: Record<Lang, Strings> = { en, ar };

export type StringKey = keyof Strings;
