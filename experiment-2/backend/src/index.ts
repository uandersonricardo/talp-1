import app from "./app";
import { startDailyDigest } from "./services/dailyDigest";
import { logSmtpWarning } from "./services/email";

const PORT = process.env.PORT ?? 3000;

logSmtpWarning();
startDailyDigest();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
