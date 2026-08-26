const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', active);
    });
    panels.forEach((panel) => {
      const active = panel.id === `panel-${target}`;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  });
});

function getPositiveNumber(id, label) {
  const value = Number(document.getElementById(id).value);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label}은(는) 0보다 큰 숫자로 입력해 주세요.`);
  }
  return value;
}

function getGauge(value, config) {
  const position = Math.max(2, Math.min(98, ((value - config.min) / (config.max - config.min)) * 100));
  const status = config.zones.find((zone) => value < zone.until) || config.zones.at(-1);
  const segments = config.zones.map((zone) => `<span class="gauge-zone zone-${zone.color}" style="width:${zone.width}%"></span>`).join('');
  const labels = config.labels.map((label) => `<span style="left:${label.position}%">${label.text}</span>`).join('');
  return `<div class="gauge" style="--marker-position:${position}%; --status-color:${status.statusColor}">
    <div class="gauge-topline"><span>내 위치</span><span class="status">${status.name}</span></div>
    <div class="gauge-track">${segments}<span class="gauge-marker" aria-label="계산 결과 위치"></span></div>
    <div class="gauge-labels">${labels}</div>
    <p class="gauge-note">${config.note}</p>
  </div>`;
}

function showResult(id, label, value, gauge) {
  const result = document.getElementById(id);
  result.innerHTML = `<p>${label}</p><strong>${value}</strong>${gauge}`;
  result.hidden = false;
}

function handleCalculation(formId, callback) {
  document.getElementById(formId).addEventListener('submit', (event) => {
    event.preventDefault();
    try { callback(); } catch (error) { window.alert(error.message); }
  });
}

handleCalculation('obesity-form', () => {
  const height = getPositiveNumber('obesity-height', '신장');
  const weight = getPositiveNumber('obesity-weight', '현재 체중');
  const standardWeight = height >= 160 ? (height - 100) * 0.9 : height >= 150 ? (height - 150) * 0.5 + 50 : height - 100;
  if (standardWeight <= 0) throw new Error('올바른 신장을 입력해 주세요.');
  const obesity = (weight / standardWeight) * 100;
  const gauge = getGauge(obesity, {
    min: 60, max: 150, labels: [{ text: '60%', position: 0 }, { text: '90%', position: 33.3 }, { text: '110%', position: 55.5 }, { text: '150%', position: 100 }], note: '표준체중 대비 90~110%를 정상 참고 구간으로 표시합니다.',
    zones: [
      { until: 90, width: 33.3, color: 'caution', name: '저체중 주의', statusColor: '#a27500' },
      { until: 110, width: 22.2, color: 'safe', name: '정상 범위', statusColor: '#168257' },
      { until: Infinity, width: 44.5, color: 'danger', name: '과체중·비만 주의', statusColor: '#c83e3e' },
    ],
  });
  showResult('obesity-result', `표준체중 ${standardWeight.toFixed(1)} kg · 비만도`, `${obesity.toFixed(1)}%`, gauge);
});

handleCalculation('bmi-form', () => {
  const heightMeter = getPositiveNumber('bmi-height', '신장') / 100;
  const weight = getPositiveNumber('bmi-weight', '체중');
  const bmi = weight / heightMeter ** 2;
  const gauge = getGauge(bmi, {
    min: 15, max: 35, labels: [{ text: '15', position: 0 }, { text: '18.5', position: 17.5 }, { text: '23', position: 40 }, { text: '25', position: 50 }, { text: '35', position: 100 }], note: '성인 BMI 18.5~22.9는 정상, 23 이상은 과체중, 25 이상은 비만 참고 구간입니다.',
    zones: [
      { until: 18.5, width: 17.5, color: 'caution', name: '저체중 주의', statusColor: '#a27500' },
      { until: 23, width: 22.5, color: 'safe', name: '정상 범위', statusColor: '#168257' },
      { until: 25, width: 10, color: 'caution', name: '과체중 주의', statusColor: '#a27500' },
      { until: Infinity, width: 50, color: 'danger', name: '비만 주의', statusColor: '#c83e3e' },
    ],
  });
  showResult('bmi-result', '나의 BMI 지수', bmi.toFixed(1), gauge);
});

handleCalculation('whr-form', () => {
  const waist = getPositiveNumber('waist', '허리 둘레');
  const hip = getPositiveNumber('hip', '엉덩이 둘레');
  const whr = waist / hip;
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const normalUpper = gender === 'male' ? 0.90 : 0.85;
  const cautionUpper = gender === 'male' ? 0.95 : 0.90;
  const gauge = getGauge(whr, {
    min: 0.65, max: 1.05, labels: [{ text: '0.65', position: 0 }, { text: normalUpper.toFixed(2), position: ((normalUpper - 0.65) / 0.4) * 100 }, { text: cautionUpper.toFixed(2), position: ((cautionUpper - 0.65) / 0.4) * 100 }, { text: '1.05', position: 100 }], note: `${gender === 'male' ? '남성' : '여성'} 기준: ${normalUpper.toFixed(2)} 미만을 정상 참고 구간으로 표시합니다.`,
    zones: [
      { until: normalUpper, width: ((normalUpper - 0.65) / 0.4) * 100, color: 'safe', name: '정상 범위', statusColor: '#168257' },
      { until: cautionUpper, width: ((cautionUpper - normalUpper) / 0.4) * 100, color: 'caution', name: '주의 구간', statusColor: '#a27500' },
      { until: Infinity, width: ((1.05 - cautionUpper) / 0.4) * 100, color: 'danger', name: '복부비만 주의', statusColor: '#c83e3e' },
    ],
  });
  showResult('whr-result', '나의 허리 엉덩이 둘레비 (WHR)', whr.toFixed(2), gauge);
});
