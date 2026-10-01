<div align="center">

# CueVibed

**An open-source AI meeting copilot for macOS. Live transcripts, automatic answers, and a UI you can actually make comfortable.**

Use a local model, bring your own API key, and keep the conversation in view.

<img src="docs/tutorial.png" width="620" alt="CueVibed welcome screen with its circular avatar and redesigned tutorial" />

</div>

> [!IMPORTANT]
> **Please read this first.** CueVibed tries to stay out of screen recordings/shares, but this is **best-effort, not guaranteed** — on macOS 15.4+ Apple can let modern capture tools see it anyway, and a phone camera always can. Using a hidden assistant during a **proctored exam, job interview, or recorded meeting** may break that platform's rules and, in some places, consent laws. CueVibed is built for legitimate uses — your own notes, studying, accessibility, and practice. **You are responsible for how you use it.**

## Why CueVibed?

Meeting assistants should help while the conversation is happening. CueVibed listens to your microphone and meeting audio, transcribes them separately, and can automatically suggest a short answer when the other side asks a question.

This is a fork of [Cue](https://github.com/Blueturboguy07/cue), focused on **macOS with Apple Silicon**. Cue provides the foundation: transcription, model integrations, screen-aware assistance, and meeting memory. CueVibed adds automatic question responses and a more usable, customizable meeting interface.

Run transcription and answers locally, or choose hosted providers independently. The app is open source; hosted providers may charge for their services. A local setup needs a running model server and downloaded models.

## What this fork adds

These are changes relative to the Cue version this fork started from—not a claim about every future upstream release.

| Addition | What it means during a meeting |
|---|---|
| **Automatic answers** | Detects questions and requests in meeting audio and generates a brief response without clicking Send. Includes a short delay for continuation and duplicate suppression. |
| **Resizable overlay** | Drag the bottom-right handle to make room for answers. Window dimensions are remembered. |
| **Conversation scrolling** | Replies stay in view as they stream. Scroll up to read earlier answers; return to the bottom to resume following. |
| **Transcript history open by default** | See the conversation immediately; tuck it away with the history button when you want more space. |
| **Separate Settings window** | Drag Settings aside or onto another display. It stays above the meeting overlay while open. |
| **Redesigned Settings** | Sidebar navigation, grouped controls, responsive rows, and consistent line icons. |
| **Readable transparency** | Background opacity changes without fading the answer text and controls. |
| **Independent text sizes** | Choose Small, Medium, or Large separately for answers and transcripts. |
| **Settings themes** | System, Light, and Dark, with an opaque Settings surface independent of overlay transparency. |
| **Noise handling adjustments** | Automatic microphone gain is disabled and speech detection requires sustained sound before accepting an utterance, reducing isolated click triggers. |
| **Refreshed onboarding** | CueVibed branding, clearer setup copy, and a consistent visual style. |

Noise filtering is not a speech classifier: sustained noise can still get through, and very short speech can be missed.

## What you can do

| Feature | How to trigger | What it uses |
|---|---|---|
| **Smart assist** | `⌘` `⇧` `↵` | Your screen + recent conversation |
| **What should I say?** | `⌘` `↵` | Meeting audio + your mic |
| **Recap** | Button | The conversation |
| **Ask anything** | Type + `↵` | Your screen + conversation |
| **Solve a coding problem** | `⌘` `H` | Your screen only |
| **Smart** toggle | Pill in the typing box | Switches between your configured Fast and Smart models |
| **Auto-answer** | Enable the toggle beside the typing box | Detected questions from meeting audio (**Them**) + recent conversation |

- **Follow a live transcript:** your microphone appears as **You**; system audio appears as **Them**.
- **Get automatic or manual answers:** enable Auto-answer, type a question, or ask what to say next.
- **Ask about your screen:** use Smart assist with a model that supports image input.
- **Recap the conversation:** generate a summary using your selected model.
- **Keep meeting context:** inherited meeting memory saves transcripts locally and can generate notes with your chosen chat provider.
- **Choose your stack:** local Whisper transcription, local OpenAI-compatible chat servers, or supported hosted providers.

**Auto-answer is off by default.** It responds only to the **Them** channel and uses lightweight English question/request patterns. It will not answer every sentence or reliably understand every phrasing.

**There is no built-in web research or document RAG pipeline.** Answers come from your selected model and the context supplied by the app. They are not automatically checked against current documentation or guaranteed to be correct.

## Run on macOS

CueVibed supports **macOS on Apple Silicon**. **Windows is not supported, and there are no plans for a Windows port.** Linux and Intel Macs are also unsupported.

### Download a packaged app

Check this fork's [Releases](../../releases) for an Apple Silicon macOS build. If one is available, download the `mac-arm64.zip`, unzip it, and move `cue.app` into Applications. If there is no suitable release, use the source instructions below. Upstream Cue releases do not include CueVibed's changes.

### From source

Requirements:

- Node.js **22.12 or newer** and npm.
- For local transcription: **CMake** and **Xcode command-line tools** to prepare the Whisper runtime.
- Microphone and screen/audio-recording permissions for the capture features you use.

```bash
git clone https://github.com/0fif/cuevibed.git
cd cuevibed
npm install
npm run prepare:whisper
npm start
```

Skip `prepare:whisper` if you only use hosted transcription. It prepares the runtime; you still download a speech model from Settings.

Quit other running copies of Cue or CueVibed before starting. Running from source does not update an app already in Applications.

### Permissions and macOS support

Meeting-audio capture requires **macOS 14.4+** according to the app's capture requirements. Screen assistance and microphone transcription are separate features.

| Capability | macOS setup |
|---|---|
| Your microphone (**You**) | Allow Microphone access |
| Meeting/system audio (**Them**) | Enable Meeting audio and grant screen/audio-recording access |
| Screen-aware assistance | Grant Screen Recording access; choose a vision-capable chat model |
| Screen-share exclusion | Best effort; test your actual sharing setup |

Open **System Settings → Privacy & Security → Microphone** and **Screen Recording** (the wording can include system audio on newer macOS versions). Enable the running app, which may still appear as **cue** or **Electron**, and quit/reopen if requested. Permissions granted to an installed build may not apply to a development build.

### Build an app

```bash
CUE_BUNDLE_WHISPER=1 npm run dist:mac:arm64
```

For an unpacked development app, use `CUE_BUNDLE_WHISPER=1 npm run pack`. To check the prepared runtime, use `npm run verify:whisper-runtime`.

Build output goes into `dist/`. `CUE_BUNDLE_WHISPER=1` prepares and bundles the local Whisper runtime; macOS builds skip it without that flag. Signing and notarization depend on your build configuration; rebuilding may require granting macOS permissions again.

Some inherited app names and storage paths still say `cue`. CueVibed currently shares Cue's app identifier and user-data location, so it is not an isolated side-by-side installation.

## Set up your first meeting

### 1. Connect a chat model

Open **Settings → Connection**. Choose a provider and configure its credentials and model IDs.

For a local OpenAI-compatible server such as oMLX, select **Custom**:

| Setting | Example |
|---|---|
| Base URL | `http://127.0.0.1:8000/v1` |
| API key | Your local server's key, if authentication is enabled |
| Fast model | The exact model ID served by your server |
| Smart model | The same model, or another model for the Smart toggle |

Ollama also has its own provider option. Match the URL and model names to your running server. A text-only model can answer conversation questions; screen-aware requests need image support.

### Hosted providers and API keys

Use the toolbar Settings button or the `…` button beside the typing box, then open **Connection**. Provider keys are stored locally in `cue-data.json` and used for requests to the corresponding provider. Chat and speech-to-text access are separate: a working chat key does not necessarily permit transcription.

| Provider | Key/account | Configuration in CueVibed |
|---|---|---|
| **Cerebras** | [Cerebras console](https://cloud.cerebras.ai) | Chat provider; use Local or another configured service for transcription. |
| **OpenAI** | [OpenAI API keys](https://platform.openai.com/api-keys) | Chat and speech integrations. A key restricted to chat alone may fail for transcription. |
| **Anthropic** | [Anthropic console](https://console.anthropic.com) | Chat and screen-aware assistance with compatible models; configure transcription separately. |
| **Google Gemini** | [Google AI Studio](https://aistudio.google.com/apikey) | Chat and transcription integrations; model access and quotas depend on your account. |
| **Azure AI Foundry** | [Azure AI](https://ai.azure.com) | Set the endpoint and credentials. Model fields use your deployment names; transcription is separate. |
| **DeepSeek** | [DeepSeek platform](https://platform.deepseek.com/api_keys) | OpenAI-compatible chat integration; configure transcription separately. |
| **Groq** | [Groq console](https://console.groq.com) | Chat integration and a Groq Whisper batch-transcription path in Auto mode. |
| **MiniMax** | Your MiniMax account | Set the key and matching Global/China region in Connection. |
| **Ollama** | Your local server | Set the server URL and installed model IDs. |
| **Custom** | Your endpoint or gateway | Set the Base URL and Fast/Smart model IDs; chat authentication is optional if the server permits it. |

For Azure, the inherited integration normalizes endpoints to an OpenAI-compatible `/openai/v1` path. Use the endpoint and deployment names from your service rather than a generic model nickname.

Custom endpoint examples:

| Server | Base URL example | Model field |
|---|---|---|
| oMLX | `http://127.0.0.1:8000/v1` | Exact model ID loaded in oMLX |
| Ollama through Custom | `http://127.0.0.1:11434/v1` | Installed Ollama model ID |
| OpenClaw-compatible gateway | `http://127.0.0.1:18789/v1` | The gateway's configured model ID |

**Custom transcription is opt-in.** Selecting Custom for chat does not send audio there automatically. Select **Custom in Audio** only if the endpoint supports audio transcription. The current transcription implementation requires both the Custom key and Base URL, as well as a supported transcription model.

### Optional publik API integration inherited from Cue

The inherited publik integration is available only in builds configured with a publik app token. Without one, its UI stays hidden. It is not required to use a local model or your own provider keys.

When present, the onboarding disclosure explains pricing, the data path, and account setup before activation. Connection includes linking, balance, pricing, and disconnect controls. Use **Use my own key instead** to choose another provider. Check the disclosure and service's current pricing for request costs, plans, and any available credits.

For maintainers, source builds can use `PUBLIK_APP_TOKEN`; the inherited release workflow can embed a repository secret of the same name. This integration should not be confused with a guarantee that every CueVibed build includes a hosted service.

### 2. Configure transcription

Open **Settings → Audio**:

1. Choose **Local** for on-device Whisper transcription.
2. Select a model, download it, and wait for the runtime and model to be ready.
3. Enable **Meeting audio** to capture the other side of the call.

Alternatively, choose a hosted transcription option. The chat provider and transcription provider are configured separately.

Local mode does not silently fall back to cloud transcription. Model downloads need a network connection; local transcription itself runs on your Mac.

### Local model management and streaming transcription

`base.en` is the default recommended English model. Settings includes multilingual and quantized alternatives. Larger models can require substantially more memory and inference time; download size is not a runtime memory estimate.

- The local model loads once per listening session and serves both **You** and **Them**.
- Downloads support cancellation/resume and are verified against pinned sizes and SHA-256 hashes.
- Models can be imported or deleted in **Settings → Audio**.
- Captured audio is processed in memory rather than written to temporary audio files.
- Stopping capture stops new audio immediately; queued local transcription is allowed a bounded drain before the runtime shuts down.

The inherited streaming implementation supports Deepgram and OpenAI, with batch-transcription paths for other configurations. In **Auto**, available credentials determine the route; local transcription must be explicitly selected to keep audio local. The current Audio UI exposes Auto, Local, OpenAI, and Custom. Gemini Live exists in the underlying integration, but there is no Gemini-specific selector in the current UI. Auto with a Gemini-only key uses batch transcription.

### 3. Start listening

Grant the permissions macOS requests, then click **Start session**. If macOS asks you to quit and reopen the app after granting access, do so.

Meeting audio captures **system output**, not a selected Zoom or Teams participant. Browser videos, music, and other audible apps can also appear as **Them**. Pause unrelated audio during a call.

Enable **Auto-answer** beside the typing box to respond to detected questions. Keep it off when you want to ask manually.

### Useful controls

| Control | Action |
|---|---|
| **Start session / Stop** | Start or stop capture |
| **Auto-answer** | Toggle responses to detected meeting-audio questions |
| **Smart** | Switch between your configured Fast and Smart models |
| **Transcription history** | Show or hide the transcript sidebar |
| **Hide** | Collapse the meeting panel |
| **Bottom-right resize handle** | Resize the overlay; arrow keys also work when the handle is focused |
| **⌘ Enter** | Suggest what to say next |
| **⌘ Shift Enter** | Smart assist |
| **⌘ H** | Solve the coding problem on screen |
| **⌘ Shift X** | Quit |

Drag the overlay by its top toolbar. Empty areas around the overlay are click-through. Reopen the tutorial using the help icon; Settings opens in its own movable window.

### Meeting memory

Transcripts are persisted in `meetings.json` in the app's data directory. Writes are coalesced, so an abrupt crash can lose the most recent unsaved turns; this is not a guarantee of zero data loss.

An open meeting with activity within the last 30 minutes can be resumed on launch. After a qualifying meeting ends, the selected chat model generates notes such as a summary, decisions, action items, and follow-ups. The default minimum for notes is four transcript turns. The last three meeting summaries can provide context for future requests, and the newest 50 meetings are retained.

Stopping listening or clearing the current transcript ends the current meeting. Clearing the visible transcript is not the same as deleting previously saved meeting history.

### AI rules and professional background

Use **Settings → AI behavior → AI rules** to control tone, length, and format. These rules apply to the response modes described in the UI; coding-problem solves have their own formatting rules.

The inherited model-context code also supports saved résumé and job-description fields. The current Settings UI does **not** expose a résumé editor. Existing saved background text can still be included in model requests. Keep that in mind if you reuse an upstream Cue data directory.

### Screen sharing and Zoom

The original setup guidance recommends **Zoom → Settings → Share Screen → Advanced → Screen capture mode → Advanced capture with window filtering**, where that option is available. Capture settings and behavior can vary by Zoom/macOS version; test with a separate viewer before relying on exclusion.

<div align="center"><img src="docs/zoom-setting.png" width="560" alt="Zoom's screen capture mode options, including window filtering" /></div>

Window filtering is intended to respect a window's capture-exclusion flag. Modes without filtering can include the overlay. Test Teams, Meet, and recording tools with your actual capture setup too. The macOS recording indicator can remain visible even when the overlay itself is excluded.

## How it works

CueVibed is an Electron app. Its three inputs remain separate:

- **Screen:** screenshots are captured when a screen-aware action needs them and supplied to your chat model.
- **Microphone (You):** `getUserMedia` supplies audio to a 16 kHz processing pipeline.
- **System audio (Them):** `getDisplayMedia` loopback captures system output through the macOS capture path. This is supported on macOS through the enabled ScreenCaptureKit loopback path.

The renderer sends audio to the main process. Speech detection forms utterances for transcription, and transcript context feeds the selected chat model. Answers stream back into the overlay. The auto-answer detector watches **Them** transcripts without making a separate LLM classification request.

For local transcription, one persistent `whisper-server` process listens on localhost at a temporary port with a random request path. Both channels share a serialized inference queue. Audio utterances have pre-roll so the start of speech can be retained.

```text
Main process
  ├─ Meeting overlay: capture, transcript history, streaming answers
  ├─ Separate Settings window: preferences only, no audio capture
  ├─ Screenshot capture
  ├─ Speech-to-text: local whisper.cpp or configured hosted service
  ├─ Chat model: local endpoint or configured hosted provider
  └─ Meeting memory: local transcript and notes storage
```

Screen-share exclusion uses Electron's `setContentProtection(true)`. It is an OS-level request, not a guarantee against every capture path. The `CUE_NO_PROTECT=1` launch flag disables it for screenshots and debugging.

## Privacy and capture behavior

- Local transcription processes audio on your Mac. Hosted transcription sends audio to the configured speech provider.
- Chat requests send their context to your selected model endpoint. A local endpoint can keep that processing on your machine; a hosted endpoint receives the request.
- Screen-aware features include screenshots in model requests. Meeting notes also use your configured chat model.
- Transcripts and generated meeting notes are saved locally in `meetings.json`; settings and credentials are stored locally in `cue-data.json`. Local storage is not the same as encrypted storage.
- Screen-share exclusion is **best effort** and depends on macOS and the capture tool. Test your actual sharing setup; do not assume the overlay is invisible.
- macOS can display a recording indicator while meeting-audio capture is active.
- Captured audio utterances are kept in memory; downloaded speech-model files remain on disk until deleted. Transcripts and meeting notes, unlike audio buffers, are persisted.
- Existing saved résumé/job-description text can be included in prompts sent to the selected chat provider.
- Custom requests go to the Base URL you configure. If you enable Custom transcription, that endpoint receives audio too.
- In hosted **Auto** transcription, the inherited fallback logic can try other configured speech providers. Local mode does not use that cloud fallback.
- No CueVibed account is required for local or bring-your-own-key use. The optional publik service has its own account and data flow when enabled.

## Troubleshooting

**Headphones become muffled or silent when a session starts**

Try a separate microphone while keeping your headphones as the output. Activating a Bluetooth headset's microphone can switch it into lower-quality call mode. In development, using a phone microphone with Sony headphone output avoided a playback failure seen with the headset microphone.

**Local transcription says the runtime is missing**

Install CMake and Xcode command-line tools, run `npm run prepare:whisper`, and restart. Downloading a speech model alone does not install the runtime.

**No meeting transcript or automatic answers**

Enable Meeting audio, check macOS recording permissions, and start a session. Confirm speech appears as **Them**, then enable Auto-answer. Detection is based on English question/request patterns; your microphone's **You** channel does not trigger it.

**Local answers are slow**

Try a smaller model, keep responses short, and disable reasoning/thinking in your model server if supported. Transcription time, question detection, and model generation all contribute to the delay; there is no fixed latency guarantee.

**The speech model is missing or invalid**

Open Settings → Audio, select the model, and download or import it. Wait for verification to finish. If validation repeatedly fails, delete the affected model through Settings and download it again.

**A local speech model is too slow or runs out of memory**

Try `base.en`, `tiny.en`, or an available quantized model. The speech model and your chat model share system resources; increasing either can slow a live meeting pipeline.

**“I already gave microphone or screen-recording access”**

Check the permission belongs to the build you are actually running. Rebuilding or switching between installed Cue and development Electron can require a new grant. Toggle the relevant app off/on in System Settings, then quit and reopen it; if necessary remove and re-add the app entry.

**There is no Dock icon—how do I quit?**

Use the toolbar Quit button or **⌘ Shift X**. If the shortcut is unavailable, use Activity Monitor to quit the running Cue/Electron process.

**`npm start` fails with `Cannot read properties of undefined (reading 'getPath')`**

Check whether your shell has `ELECTRON_RUN_AS_NODE` set. That makes Electron behave as Node rather than launching the app. Clear it and retry:

```bash
unset ELECTRON_RUN_AS_NODE
npm start
```

**A provider returns 403 or “no access to model”**

Check the selected model/deployment exists and that the key permits that API. Chat and transcription permissions can differ. Also check the account's quota/billing and that you selected the correct provider endpoint or MiniMax region. Local transcription does not require a hosted speech key.

**Listening produces no transcript at all**

Check microphone permission, the selected input device, and the chosen speech provider. For Local, both runtime and model must be ready. For hosted transcription, a chat-only key may not be enough. Check system-recording permission and Meeting audio separately if only **Them** is missing.

**A Custom endpoint cannot connect**

Make sure the server is running, the Base URL uses the correct port and `/v1` path, authentication matches, and the model ID exists. A working chat endpoint does not imply audio transcription support. Custom transcription must be selected explicitly and currently needs both a Base URL and key.

**CueVibed appears in a Zoom share**

Check the window-filtering option described above, make sure you did not start with `CUE_NO_PROTECT=1`, and test from another participant's view. Capture protection can still be bypassed by modern capture tools.

**macOS says the downloaded app is damaged or cannot be opened**

Build signing and notarization matter. Prefer a verified release from this repository or build from source. For a trusted build affected specifically by quarantine, `xattr -cr /Applications/cue.app` clears quarantine and other extended attributes. It does not repair a corrupted or incorrectly signed app; verify the download first.

**I want to take a screenshot of CueVibed**

Quit the app, then launch with screen-capture protection disabled:

```bash
CUE_NO_PROTECT=1 npm start
```

This also makes the app available to screen-sharing tools. Quit and launch normally to restore protection.

## Development and contributions

The app uses Electron with plain HTML, CSS, and JavaScript. Start with `main.js` for windows and orchestration, `renderer/` for the UI, and `src/` for model integrations, transcription, and meeting logic.

```bash
npm test
```

Issues and PRs are welcome, especially macOS usability fixes and reproducible audio or transcription bugs. Include your macOS version, hardware, provider/model, and reproduction steps. Remove keys and private meeting content from logs before sharing them.

## Credits and license

- [Cue](https://github.com/Blueturboguy07/cue) — the upstream project and foundation of this fork.
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp) — local transcription runtime, under the MIT License.
- [Lucide](https://lucide.dev) — line icons; see the bundled icon source and dependency license notices.

Cue's original credits also acknowledge `pickle-com/glass` and `sohzm/cheating-daddy`.

**[GPL-3.0-or-later](LICENSE).**
