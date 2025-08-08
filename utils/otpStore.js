const otpStore = new Map();

function saveOTP(phone, otp) {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // expires in 5 minutes
  });
}

function verifyOTP(phone, code) {
  const record = otpStore.get(phone);
  if (!record) return false;
  if (record.otp !== code) return false;
  if (Date.now() > record.expiresAt) return false;

  otpStore.delete(phone);
  return true;
}

module.exports = { saveOTP, verifyOTP };
