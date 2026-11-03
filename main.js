// Point replies at your inbox. Until this is set, the note stays on the page.
const RSVP_TO = "";

// 11:00 a.m. Central Time, which is UTC−6 in January.
const WEDDING_AT = new Date("2027-01-03T11:00:00-06:00");

const ticks = {
  days: document.querySelector("[data-unit='days']"),
  hours: document.querySelector("[data-unit='hours']"),
  minutes: document.querySelector("[data-unit='minutes']"),
  seconds: document.querySelector("[data-unit='seconds']"),
};
const tickRow = document.querySelector("#ticks");
const nowMessage = document.querySelector("#countdown-now");
const countdownLive = document.querySelector("#countdown-live");

function pad(value) {
  return String(value).padStart(2, "0");
}

let lastSpokenMinute = null;

function paintCountdown() {
  const remaining = WEDDING_AT.getTime() - Date.now();

  if (remaining <= 0) {
    tickRow.hidden = true;
    nowMessage.hidden = false;
    countdownLive.textContent = "It is time. Zach and Brianna are getting married.";
    return false;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  ticks.days.textContent = String(days);
  ticks.hours.textContent = pad(hours);
  ticks.minutes.textContent = pad(minutes);
  ticks.seconds.textContent = pad(seconds);

  const minuteKey = days * 1440 + hours * 60 + minutes;
  if (minuteKey !== lastSpokenMinute) {
    lastSpokenMinute = minuteKey;
    const dayLabel = days === 1 ? "day" : "days";
    const hourLabel = hours === 1 ? "hour" : "hours";
    const minuteLabel = minutes === 1 ? "minute" : "minutes";
    countdownLive.textContent = `${days} ${dayLabel}, ${hours} ${hourLabel}, and ${minutes} ${minuteLabel} until January 3 at 11 in the morning.`;
  }

  return true;
}

paintCountdown();
const countdownTimer = window.setInterval(() => {
  if (!paintCountdown()) window.clearInterval(countdownTimer);
}, 1000);

const form = document.querySelector("#rsvp");
const thanks = document.querySelector("#thanks");
const error = document.querySelector("#form-error");
const again = document.querySelector("#again");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  error.hidden = true;

  if (!form.reportValidity()) {
    error.hidden = false;
    return;
  }

  const data = new FormData(form);
  const guest = String(data.get("guest")).trim();
  const email = String(data.get("email")).trim();
  const coming = String(data.get("coming"));
  const note = String(data.get("note") || "").trim();

  const body = [
    `Name: ${guest}`,
    `Email: ${email}`,
    `Coming: ${coming}`,
    note ? `Note: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const thanksBody = document.querySelector("#thanks-body");
  if (RSVP_TO) {
    const subject = encodeURIComponent(`Wedding reply from ${guest}`);
    const href = `mailto:${RSVP_TO}?subject=${subject}&body=${encodeURIComponent(body)}`;
    thanksBody.textContent =
      "A draft should be open in your email. Send it, and the note is ours. The formal invitation still comes later.";
    window.location.href = href;
  } else {
    thanksBody.textContent =
      "The formal invitation still comes later. Until it does, tell us in person — we like that version too.";
  }

  form.hidden = true;
  thanks.hidden = false;
  thanks.querySelector("h2").focus();
});

again.addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  thanks.hidden = true;
  form.querySelector("#guest").focus();
});
