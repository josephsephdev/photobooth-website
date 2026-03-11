export const els = {
  cache() {
    // home screen
    this.homeScreen = document.getElementById('homeScreen');
    this.startSessionBtn = document.getElementById('startSessionBtn');
    this.pageHeader = document.getElementById('pageHeader');

    // screens & containers
    this.templateSelectScreen = document.getElementById('templateSelectScreen');
    this.templateBackBtn = document.getElementById('templateBackBtn');
    this.sessionScreen = document.getElementById('sessionScreen');
    this.resultsScreen = document.getElementById('resultsScreen');
    this.templateGrid = document.getElementById('templateGrid');

    // camera area
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.countdown = document.getElementById('countdown');
    this.cropGuideOverlay = document.getElementById('cropGuideOverlay');
    this.progressText = document.getElementById('progressText');
    this.progressDots = document.getElementById('progressDots');
    this.previewGrid = document.getElementById('previewGrid');
    this.cameraModeIndicator = document.getElementById('cameraModeIndicator');

    // photo review overlay
    this.photoReviewOverlay = document.getElementById('photoReviewOverlay');

    // controls
    this.startBtn = document.getElementById('startBtn');
    this.retakeBtn = document.getElementById('retakeBtn');
    this.cancelBtn = document.getElementById('cancelBtn');

    // timer
    this.timerMinus = document.getElementById('timerMinus');
    this.timerPlus = document.getElementById('timerPlus');
    this.timerValueEl = document.getElementById('timerValue');
    this.timerSelector = document.getElementById('timerSelector');

    // results toggle
    this.photoToggle = document.getElementById('photoToggle');
    this.qrToggle = document.getElementById('qrToggle');
    this.photoView = document.getElementById('photoView');
    this.qrView = document.getElementById('qrView');

    // results media
    this.finalImage = document.getElementById('finalImage');
    this.qrCodeImage = document.getElementById('qrCodeImage');
    this.folderLink = document.getElementById('folderLink');
    this.processingOverlay = document.getElementById('processingOverlay');
    this.resultsContainer = document.getElementById('resultsContainer');

    // filter screen
    this.filterScreen = document.getElementById('filterScreen');
    this.filterPreviewImg = document.getElementById('filterPreviewImg');
    this.filterOptionsGrid = document.getElementById('filterOptionsGrid');
    this.filterDoneBtn = document.getElementById('filterDoneBtn');

    // print modal
    this.printBtn = document.getElementById('printBtn');
    this.printModal = document.getElementById('printModal');
    this.decreaseBtn = document.getElementById('decreaseBtn');
    this.increaseBtn = document.getElementById('increaseBtn');
    this.quantityDisplay = document.getElementById('quantityDisplay');
    this.confirmPrintBtn = document.getElementById('confirmPrintBtn');
    this.cancelPrintBtn = document.getElementById('cancelPrintBtn');

    this.newSessionBtn = document.getElementById('newSessionBtn');
  }
};
