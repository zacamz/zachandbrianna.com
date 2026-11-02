// Point replies at your inbox. Until this is set, the note stays on the page.
const RSVP_TO = "";

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
