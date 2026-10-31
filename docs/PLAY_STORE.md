# Publishing to Google Play

## One-time: the signing key
1. GitHub → **Actions** → **Create Android upload key (run once)** → **Run workflow**. Wait for it to finish.
2. Open the run, download the artifact **pikop-upload-key-SECRET** (it is deleted after 1 day). Unzip it.
3. Keep `upload.jks` and `password.txt` somewhere private (password manager). Never commit them.
4. GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - `ANDROID_KEYSTORE_BASE64` = the whole contents of `keystore.b64`
   - `ANDROID_KEYSTORE_PASSWORD` = the contents of `password.txt`
5. Delete the workflow artifact. In Play Console, use **Play App Signing** (the default). Then this key is only an upload key and can be reset if lost.

## Every release
Push to `main` (or run **Build Android**). The run produces `pikop-driver-play-bundle` (`.aab`, upload this to Play) and `pikop-driver-test-apk` (install on a phone to try).
