/**
 * WrenchCall AI — Core Interactive Application Logic
 */

// Lucide is loaded from a CDN. If that request fails the page must still work,
// so every icon render goes through this guard instead of calling the global
// directly — an unguarded call throws and halts whatever invoked it.
function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    try {
      window.lucide.createIcons();
    } catch (err) {
      console.warn('Icon rendering skipped:', err);
    }
  }
}

// ==========================================
// SCENARIO DEFINITIONS FOR CALL SIMULATOR
// ==========================================
const scenarios = {
  emergency: {
    title: "🚨 Emergency: Burst Water Pipe",
    callerInfo: "Caller: Michael Foster — (720) 555-8921",
    dossier: {
      name: "Michael Foster",
      phone: "(720) 555-8921",
      address: "1428 Maple Ridge Rd, Denver",
      category: "Emergency Plumbing / Active Leak",
      urgency: "CRITICAL (Active Flood)",
      urgencyColor: "text-red-400 bg-red-500/10 border-red-500/30",
      slot: "Today @ 11:30 AM (Emergency Window)",
      est: "$350 - $750 (Pipe Repair + Shutoff)"
    },
    smsPayload: `🚨 [URGENT DISPATCH - WrenchCall AI]
Customer: Michael Foster
Phone: (720) 555-8921
Issue: Main copper line burst under kitchen sink. Active spray.
Address: 1428 Maple Ridge Rd, Denver CO
Slot Booked: Today @ 11:30 AM (Next available)
Safety Action: Caller instructed to turn off main basement valve.
Photo Request: SMS link sent to caller.
Jobber Event: Synced to Dave's Schedule.`,
    dialogue: [
      { speaker: "caller", text: "Help! My main pipe under the kitchen sink just burst and water is flooding the floor! Can somebody get out here right now?" },
      { speaker: "ai", text: "I'm right here with you! First, can you locate the round oval shut-off valve right under that sink or at your main basement shutoff and turn it clockwise to stop the water?" },
      { speaker: "caller", text: "Okay, running to the basement... okay, valve is turned, it slowed down! Who is this? When can Dave come?" },
      { speaker: "ai", text: "This is Sarah with WrenchCall.ai, Dave's 24/7 lead dispatcher. Dave is wrapping up a job 12 minutes away. I can lock you in for his emergency priority slot today at 11:30 AM. Can I get your full name and address?" },
      { speaker: "caller", text: "Yes! Michael Foster, 1428 Maple Ridge Road in Denver." },
      { speaker: "ai", text: "Got it, Michael. You're confirmed for 11:30 AM. Our standard emergency dispatch fee is $89, which Dave applies toward any pipe repairs. I just texted your cell a secure link from WrenchCall.ai to snap a photo of the broken pipe so Dave brings the exact copper fittings. Hang tight, he's on the way!" },
      { speaker: "caller", text: "Thank goodness. You guys are lifesavers. See Dave at 11:30." }
    ]
  },

  handyman: {
    title: "🔨 Handyman: Drywall Hole & Sticky Bedroom Door",
    callerInfo: "Caller: Amanda Brooks — (512) 555-3419",
    dossier: {
      name: "Amanda Brooks",
      phone: "(512) 555-3419",
      address: "804 Westlake Dr, Austin TX",
      category: "Handyman / Drywall & Carpentry",
      urgency: "Standard (Scheduled)",
      urgencyColor: "text-amber-300 bg-amber-500/10 border-amber-500/30",
      slot: "Thursday @ 9:00 AM",
      est: "$280 - $450 (Drywall patch + door planing)"
    },
    smsPayload: `🔨 [NEW JOB LEAD - WrenchCall AI]
Customer: Amanda Brooks
Phone: (512) 555-3419
Issue: 6-inch doorknob drywall puncture + master bedroom door sticking on carpet.
Address: 804 Westlake Dr, Austin TX
Slot Booked: Thursday @ 9:00 AM (2-hour estimate slot)
Photo Request: Customer uploaded 2 photos via link.
Housecall Pro: Lead & appointment logged.`,
    dialogue: [
      { speaker: "caller", text: "Hi there! I'm moving out of my rental next week and I have a hole in the drywall from a doorknob and a sticking bedroom door. Do you guys do small handyman repairs?" },
      { speaker: "ai", text: "Hi! Thanks for calling Austin Craft Handyman, powered by WrenchCall.ai! Yes, Marco handles drywall patching, texture matching, and interior door adjustments all the time. He has over 15 years of carpentry experience. Where are you located?" },
      { speaker: "caller", text: "I'm in Austin over on Westlake Drive. How does your pricing work for something like that?" },
      { speaker: "ai", text: "Marco typically handles drywall patches and door planing as a flat-rate project, usually between $250 and $450 depending on texture. Marco has availability this Thursday at 9:00 AM or Friday at 1:00 PM. Which works better for you?" },
      { speaker: "caller", text: "Thursday morning at 9:00 AM would be perfect!" },
      { speaker: "ai", text: "Wonderful. Can I confirm your name and exact street address for the dispatch calendar?" },
      { speaker: "caller", text: "Amanda Brooks, 804 Westlake Drive." },
      { speaker: "ai", text: "You're booked for Thursday at 9:00 AM, Amanda. I just texted you a secure link from WrenchCall.ai where you can upload a quick snapshot of the wall texture so Marco can bring the matching mud and compound. Have a great day!" }
    ]
  },

  waterheater: {
    title: "♨️ Plumbing: Tankless Water Heater Quote",
    callerInfo: "Caller: Robert Chen — (813) 555-6740",
    dossier: {
      name: "Robert Chen",
      phone: "(813) 555-6740",
      address: "3310 Bayside Blvd, Tampa FL",
      category: "High-Ticket / Water Heater Replacement",
      urgency: "High Value Lead ($$$)",
      urgencyColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      slot: "Tomorrow @ 1:30 PM (Consultation)",
      est: "$3,200 - $4,800 (Tankless Navien Conversion)"
    },
    smsPayload: `💰 [HIGH TICKET CONVERSION - WrenchCall AI]
Customer: Robert Chen
Phone: (813) 555-6740
Job: Tankless Water Heater Upgrade (Replacing 12yo 50-gal tank).
Gas or Electric: Natural Gas.
Address: 3310 Bayside Blvd, Tampa FL
Slot Booked: Tomorrow @ 1:30 PM
Estimated Job Value: $3,500+
Contractor Note: Customer already has gas line in garage. High close probability!`,
    dialogue: [
      { speaker: "caller", text: "Hello, my 50-gallon water heater is 12 years old and rusting out. Before it blows, I want to convert our house to a tankless gas system like a Rinnai or Navien. Do you guys install those?" },
      { speaker: "ai", text: "Hello! Thanks for calling Apex Plumbing, powered by WrenchCall.ai! Absolutely. We specialize in tankless conversions and Navien installations. Smart move replacing it before it leaks all over your floor! Do you currently have a natural gas line run to the heater location?" },
      { speaker: "caller", text: "Yes, natural gas line is right there in the garage beside the old tank." },
      { speaker: "ai", text: "Great, that makes the conversion much smoother. We offer free on-site sizing consultations where our master plumber inspects your venting and calculates your household GPM demand. Can I get your address in the Tampa area?" },
      { speaker: "caller", text: "Sure, Robert Chen at 3310 Bayside Blvd." },
      { speaker: "ai", text: "Thanks Robert. We have an open consultation window tomorrow, Wednesday at 1:30 PM. Would you like me to reserve that for you?" },
      { speaker: "caller", text: "Yes, tomorrow at 1:30 PM works great. Will I get a written estimate then?" },
      { speaker: "ai", text: "Yes, you'll receive a detailed written estimate with multiple brand and warranty options right on the spot. I’ve reserved tomorrow at 1:30 PM for you and sent an SMS confirmation to this number." }
    ]
  }
};

// Single source of truth for pricing: the cards, the billing toggle and the
// signup modal all read from here, so an annual visitor is never quoted and
// never recorded at the monthly price.
const TIER_PRICES = {
  'Solo Wrench':        { monthly: 79,  annual: 63 },
  'Pro Dispatch':       { monthly: 149, annual: 119 },
  'Fleet & 24/7 Elite': { monthly: 299, annual: 239 }
};

let currentScenarioKey = 'emergency';
let isSimulating = false;
let simulationTimeoutId = null;

// ==========================================
// SIMULATOR CONTROLS & TIMED STEPPER
// ==========================================
function setScenario(key) {
  if (isSimulating) {
    stopSimulation();
  }
  currentScenarioKey = key;

  // Update tabs
  document.querySelectorAll('.scenario-tab').forEach(tab => {
    tab.classList.remove('bg-amber-500', 'text-slate-950');
    tab.classList.add('bg-slate-800', 'text-slate-300');
  });

  const activeTab = document.getElementById(`tab-${key}`);
  if (activeTab) {
    activeTab.classList.remove('bg-slate-800', 'text-slate-300');
    activeTab.classList.add('bg-amber-500', 'text-slate-950');
  }

  // Reset dialogue and previews
  resetSimulatorUI();
}

function resetSimulatorUI() {
  const scenario = scenarios[currentScenarioKey];
  document.getElementById('simCallerInfo').textContent = scenario.callerInfo;
  document.getElementById('simStatusText').textContent = "Ready To Simulate";
  document.getElementById('simStatusText').className = "text-xs font-bold uppercase tracking-wider text-slate-400";
  document.getElementById('simLed').className = "w-3.5 h-3.5 rounded-full bg-slate-600 transition-colors";
  
  const playBtn = document.getElementById('simPlayBtn');
  playBtn.innerHTML = `<i data-lucide="phone-forwarded" class="w-4 h-4"></i><span>Simulate Call Now</span>`;
  playBtn.className = "px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-amber-glow transition";

  document.getElementById('soundwaveContainer').classList.remove('playing');
  document.getElementById('soundwaveContainer').style.opacity = '0.35';

  // Clear dialogue
  const container = document.getElementById('dialogueContainer');
  container.innerHTML = `
    <div class="text-center py-12 text-slate-500 text-sm">
      <i data-lucide="phone-call" class="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-400"></i>
      Click <strong>"Simulate Call Now"</strong> above to see how WrenchCall AI captures this lead while the plumber keeps working.
    </div>
  `;

  // Reset dossier
  document.getElementById('dossierStatus').textContent = "Awaiting Call";
  document.getElementById('dossierStatus').className = "text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400";
  document.getElementById('dossierName').textContent = "—";
  document.getElementById('dossierPhone').textContent = "—";
  document.getElementById('dossierAddress').textContent = "—";
  document.getElementById('dossierCategory').textContent = "—";
  document.getElementById('dossierUrgency').textContent = "—";
  document.getElementById('dossierUrgency').className = "font-bold text-slate-400";
  document.getElementById('dossierSlot').textContent = "—";
  document.getElementById('dossierEst').textContent = "—";

  document.getElementById('smsAlertText').innerHTML = `[Click "Simulate Call Now" above to see the automated dispatch alert text]`;

  renderIcons();
}

function toggleSimulation() {
  if (isSimulating) {
    stopSimulation();
  } else {
    startSimulation();
  }
}

function stopSimulation() {
  isSimulating = false;
  if (simulationTimeoutId) {
    clearTimeout(simulationTimeoutId);
    simulationTimeoutId = null;
  }
  resetSimulatorUI();
}

function startSimulation() {
  isSimulating = true;
  const scenario = scenarios[currentScenarioKey];

  // Update Status UI
  document.getElementById('simStatusText').textContent = "In Call • Live AI Audio";
  document.getElementById('simStatusText').className = "text-xs font-bold uppercase tracking-wider text-emerald-400 animate-pulse";
  document.getElementById('simLed').className = "w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping";

  const playBtn = document.getElementById('simPlayBtn');
  playBtn.innerHTML = `<i data-lucide="square" class="w-4 h-4"></i><span>End Simulation</span>`;
  playBtn.className = "px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 transition";
  renderIcons();

  document.getElementById('soundwaveContainer').classList.add('playing');
  document.getElementById('soundwaveContainer').style.opacity = '1';

  document.getElementById('dossierStatus').textContent = "Extracting Info...";
  document.getElementById('dossierStatus').className = "text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse";

  const container = document.getElementById('dialogueContainer');
  container.innerHTML = "";

  // Play conversation step-by-step
  playDialogueStep(scenario, 0);
}

function playDialogueStep(scenario, stepIndex) {
  if (!isSimulating) return;

  if (stepIndex >= scenario.dialogue.length) {
    // Finished simulation
    finishSimulation(scenario);
    return;
  }

  const step = scenario.dialogue[stepIndex];
  const container = document.getElementById('dialogueContainer');

  const bubble = document.createElement('div');
  bubble.className = "bubble-appear flex items-start gap-2.5 " + (step.speaker === 'ai' ? 'justify-end' : '');

  if (step.speaker === 'caller') {
    bubble.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
        <i data-lucide="user" class="w-4 h-4"></i>
      </div>
      <div class="bg-slate-800 text-slate-100 p-3 rounded-2xl rounded-tl-sm border border-slate-700/60 max-w-[85%] text-xs sm:text-sm">
        <div class="text-[10px] text-slate-400 font-semibold mb-1">Customer</div>
        ${step.text}
      </div>
    `;
  } else {
    bubble.innerHTML = `
      <div class="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm border border-blue-500/50 shadow-sm max-w-[85%] text-xs sm:text-sm text-left">
        <div class="text-[10px] text-blue-200 font-semibold mb-1 flex items-center gap-1">
          <i data-lucide="bot" class="w-3 h-3"></i> WrenchCall AI (Receptionist)
        </div>
        ${step.text}
      </div>
      <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0">
        <i data-lucide="wrench" class="w-4 h-4 stroke-[2.5]"></i>
      </div>
    `;
  }

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  renderIcons();

  // Progressively update dossier values based on step
  updateDossierProgress(scenario, stepIndex);

  // Variable delay between sentences (realistic pauses)
  const delay = step.speaker === 'ai' ? 3200 : 2500;
  simulationTimeoutId = setTimeout(() => {
    playDialogueStep(scenario, stepIndex + 1);
  }, delay);
}

function updateDossierProgress(scenario, stepIndex) {
  if (stepIndex >= 0) {
    document.getElementById('dossierPhone').textContent = scenario.dossier.phone;
    document.getElementById('dossierCategory').textContent = scenario.dossier.category;
  }
  if (stepIndex >= 2) {
    document.getElementById('dossierUrgency').textContent = scenario.dossier.urgency;
    document.getElementById('dossierUrgency').className = `font-bold px-2 py-0.5 rounded text-xs border ${scenario.dossier.urgencyColor}`;
  }
  if (stepIndex >= 4) {
    document.getElementById('dossierName').textContent = scenario.dossier.name;
    document.getElementById('dossierAddress').textContent = scenario.dossier.address;
  }
  if (stepIndex >= 5) {
    document.getElementById('dossierSlot').textContent = scenario.dossier.slot;
    document.getElementById('dossierEst').textContent = scenario.dossier.est;
  }
}

function finishSimulation(scenario) {
  document.getElementById('simStatusText').textContent = "Call Completed & Dispatched";
  document.getElementById('simStatusText').className = "text-xs font-bold uppercase tracking-wider text-emerald-400";
  document.getElementById('simLed').className = "w-3.5 h-3.5 rounded-full bg-emerald-500";
  document.getElementById('soundwaveContainer').classList.remove('playing');
  document.getElementById('soundwaveContainer').style.opacity = '0.35';

  document.getElementById('dossierStatus').textContent = "✓ Synced & Locked";
  document.getElementById('dossierStatus').className = "text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";

  // Display complete SMS alert
  const smsContainer = document.getElementById('smsAlertText');
  smsContainer.innerHTML = `<pre class="whitespace-pre-wrap font-mono text-[11px] sm:text-xs text-amber-300">${scenario.smsPayload}</pre>`;

  const playBtn = document.getElementById('simPlayBtn');
  playBtn.innerHTML = `<i data-lucide="rotate-ccw" class="w-4 h-4"></i><span>Replay Call</span>`;
  playBtn.className = "px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center gap-2 border border-slate-700 transition";
  renderIcons();

  isSimulating = false;
}

// ==========================================
// INTERACTIVE ROI CALCULATOR
// ==========================================
function calculateROI() {
  const missedCallsInput = document.getElementById('missedCallsInput');
  const avgTicketInput = document.getElementById('avgTicketInput');
  const closeRateInput = document.getElementById('closeRateInput');

  const missedCalls = parseInt(missedCallsInput.value, 10);
  const avgTicket = parseInt(avgTicketInput.value, 10);
  const closeRate = parseInt(closeRateInput.value, 10) / 100;

  // Labels
  document.getElementById('missedCallsVal').textContent = `${missedCalls} calls`;
  document.getElementById('avgTicketVal').textContent = `$${avgTicket.toLocaleString()}`;
  document.getElementById('closeRateVal').textContent = `${Math.round(closeRate * 100)}%`;

  // Calculations
  const callsPerMonth = missedCalls * 4.333; // Average weeks per month
  const jobsCapturedPerMonth = Math.round(callsPerMonth * closeRate);
  const monthlyRevenue = jobsCapturedPerMonth * avgTicket;
  const annualRevenue = monthlyRevenue * 12;

  const proCost = 149;
  const netMonthlyProfit = Math.max(0, monthlyRevenue - proCost);
  const roi = (monthlyRevenue / proCost).toFixed(1);

  // DOM Updates
  document.getElementById('monthlyLoss').textContent = `$${monthlyRevenue.toLocaleString()}`;
  document.getElementById('annualLoss').textContent = `$${annualRevenue.toLocaleString()}`;
  document.getElementById('jobsCaptured').textContent = `${jobsCapturedPerMonth} jobs / month`;
  document.getElementById('netProfit').textContent = `+$${netMonthlyProfit.toLocaleString()} / month`;
  document.getElementById('roiMultiple').textContent = `${roi}x ROI`;
}

// ==========================================
// BILLING TOGGLE (MONTHLY VS ANNUAL 20% OFF)
// ==========================================
let currentBilling = 'monthly';

function setBilling(cycle) {
  currentBilling = cycle;
  const btnMonthly = document.getElementById('billingMonthly');
  const btnAnnual = document.getElementById('billingAnnual');

  const starterEl = document.querySelector('.price-starter');
  const proEl = document.querySelector('.price-pro');
  const fleetEl = document.querySelector('.price-fleet');

  if (cycle === 'monthly') {
    btnMonthly.className = "px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 transition-all";
    btnAnnual.className = "px-5 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1.5";

    starterEl.textContent = `$${TIER_PRICES['Solo Wrench'].monthly}`;
    proEl.textContent = `$${TIER_PRICES['Pro Dispatch'].monthly}`;
    fleetEl.textContent = `$${TIER_PRICES['Fleet & 24/7 Elite'].monthly}`;
  } else {
    btnAnnual.className = "px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 transition-all flex items-center gap-1.5";
    btnMonthly.className = "px-5 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all";

    // 20% discount prices
    starterEl.textContent = `$${TIER_PRICES['Solo Wrench'].annual}`;
    proEl.textContent = `$${TIER_PRICES['Pro Dispatch'].annual}`;
    fleetEl.textContent = `$${TIER_PRICES['Fleet & 24/7 Elite'].annual}`;
  }
}

// ==========================================
// FAQ ACCORDION TOGGLING
// ==========================================
function toggleFaq(button) {
  const content = button.nextElementSibling;
  const icon = button.querySelector('[data-lucide="chevron-down"]');

  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    if (icon) icon.classList.add('rotate-180');
  } else {
    content.classList.add('hidden');
    if (icon) icon.classList.remove('rotate-180');
  }
}

// ==========================================
// TRIAL SIGNUP MODAL MANAGEMENT
// ==========================================
function openModal(tierName) {
  const modal = document.getElementById('signupModal');
  const tierLabel = document.getElementById('selectedTierLabel');
  const tierInput = document.getElementById('selectedTierInput');
  const formContainer = document.getElementById('modalFormContainer');
  const successContainer = document.getElementById('modalSuccessContainer');

  const tier = TIER_PRICES[tierName] || TIER_PRICES['Pro Dispatch'];
  const isAnnual = currentBilling === 'annual';
  const priceText = `$${isAnnual ? tier.annual : tier.monthly}/mo${isAnnual ? ' billed annually' : ''}`;
  const fullLabel = `${tierName} (${priceText})`;
  tierLabel.textContent = fullLabel;
  if (tierInput) tierInput.value = fullLabel;

  formContainer.classList.remove('hidden');
  successContainer.classList.add('hidden');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('signupModal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modal on Escape key or outside click
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('signupModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'signupModal') closeModal();
});

async function handleTrialSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formContainer = document.getElementById('modalFormContainer');
  const successContainer = document.getElementById('modalSuccessContainer');
  const errorEl = document.getElementById('trialFormError');
  const submitBtn = document.getElementById('trialSubmitBtn');
  const originalLabel = submitBtn ? submitBtn.innerHTML : '';

  if (errorEl) errorEl.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
    submitBtn.textContent = 'Sending\u2026';
  }

  const restoreButton = () => {
    if (!submitBtn) return;
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
    submitBtn.innerHTML = originalLabel;
  };

  // Post the lead to Netlify's form handler. Only show the success state once
  // the lead is actually captured — a silent failure here is a lost customer.
  try {
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    });
    if (!response.ok) throw new Error(`Form endpoint returned ${response.status}`);
  } catch (err) {
    console.error('Trial signup failed:', err);
    if (errorEl) {
      errorEl.textContent = "We couldn't send that just now — your details were not submitted. Please check your connection and try again.";
      errorEl.classList.remove('hidden');
    }
    restoreButton();
    return;
  }

  restoreButton();
  formContainer.classList.add('hidden');
  successContainer.classList.remove('hidden');
  renderIcons();
}

// ==========================================
// MOBILE MENU TOGGLE
// ==========================================
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('hidden');
}

document.getElementById('mobileMenuBtn')?.addEventListener('click', toggleMobileMenu);

// ==========================================
// INITIALIZATION ON PAGE LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  calculateROI();
  resetSimulatorUI();
});
