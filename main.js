const RSVP_TO = "zachandbriannajohnson@gmail.com";

// After you deploy rsvp-sheet.gs as a web app, paste that URL here.
// Each reply is then a row in the sheet, and a copy is emailed to RSVP_TO.
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwr2e3g4uAE1aYzXRUNoUUZSATWEbdts9SPsF-Cmg6_8P82_qubYke5o-0QHSQ9oTeAAw/exec";

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
const thanksBody = document.querySelector("#thanks-body");
const error = document.querySelector("#form-error");
const again = document.querySelector("#again");
const send = form.querySelector('button[type="submit"]');
const addressBlock = document.querySelector("#address");
const addressInputs = addressBlock.querySelectorAll("input");
const MAIL_INVITE = "Please mail an official one";

function mailChosen() {
  return form.querySelector('input[name="invite"]:checked')?.value === MAIL_INVITE;
}

function syncInvite() {
  const mail = mailChosen();
  addressBlock.hidden = !mail;
  addressInputs.forEach((input) => {
    input.required = mail;
  });
}

form.querySelectorAll('input[name="invite"]').forEach((input) => {
  input.addEventListener("change", syncInvite);
});
syncInvite();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.hidden = true;
  syncInvite();

  if (!form.reportValidity()) {
    error.textContent = mailChosen()
      ? "Add your name, a real email, whether you can come, and a mailing address."
      : "Add your name, a real email, and whether you can come.";
    error.hidden = false;
    return;
  }

  const data = new FormData(form);
  if (String(data.get("_honey") || "").trim()) return;

  const guest = String(data.get("guest")).trim();
  const email = String(data.get("email")).trim();
  const coming = String(data.get("coming"));
  const invite = String(data.get("invite"));
  const note = String(data.get("note") || "").trim();
  const mail = mailChosen();
  const address = [
    String(data.get("street") || "").trim(),
    String(data.get("city") || "").trim(),
    String(data.get("state") || "").trim(),
    String(data.get("zip") || "").trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const payload = {
    name: guest,
    email,
    coming,
    invitation: invite,
    street: mail ? String(data.get("street") || "").trim() : "",
    city: mail ? String(data.get("city") || "").trim() : "",
    state: mail ? String(data.get("state") || "").trim() : "",
    zip: mail ? String(data.get("zip") || "").trim() : "",
    note,
  };

  send.disabled = true;
  send.textContent = "Sending";

  try {
    if (SHEET_URL) {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } else {
      const response = await fetch(`https://formsubmit.co/ajax/${RSVP_TO}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: `Wedding reply from ${guest}`,
          _template: "box",
          _captcha: "false",
          _replyto: email,
          Name: guest,
          Email: email,
          Coming: coming,
          Invitation: invite,
          Address: mail ? address : "Digital is fine",
          Note: note,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false || result.success === "false") {
        throw new Error(result.message || "send failed");
      }
    }
  } catch {
    error.textContent = "We couldn't send that just now. Please try again in a moment.";
    error.hidden = false;
    send.disabled = false;
    send.textContent = "Send our reply";
    return;
  }

  thanksBody.textContent = mail
    ? "We have your note, and the address for a paper invitation. The formal invitation still comes later."
    : "We have your note. A digital invitation is fine. The formal one still comes later.";
  form.hidden = true;
  thanks.hidden = false;
  thanks.querySelector("h2").focus();
  send.disabled = false;
  send.textContent = "Send our reply";
});

again.addEventListener("click", () => {
  form.reset();
  syncInvite();
  form.hidden = false;
  thanks.hidden = true;
  form.querySelector("#guest").focus();
});
