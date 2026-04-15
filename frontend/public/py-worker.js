importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let getCompletionsFn = null;
let isRunning = false;
let stdoutBuf = "";
let stderrBuf = "";
let lastFlush = 0;

function flush(force = false) {
    const now = Date.now();
    if (force || (now - lastFlush >= 30 && (stdoutBuf || stderrBuf)) || stdoutBuf.length > 2000) {
        if (stdoutBuf) {
            self.postMessage({ type: "stdout", text: stdoutBuf });
            stdoutBuf = "";
        }
        if (stderrBuf) {
            self.postMessage({ type: "stderr", text: stderrBuf });
            stderrBuf = "";
        }
        lastFlush = now;
    }
}

const initPromise = (async () => {
    self.postMessage({ type: "status", status: "loading" });
    pyodide = await loadPyodide({
        stdout: (text) => {
            stdoutBuf += text + "\n";
            flush();
        },
        stderr: (text) => {
            stderrBuf += text + "\n";
            flush();
        },
    });
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("jedi");
    pyodide.runPython(`
import jedi, json
def _get_completions(code_text, line, col):
    try:
        completions = jedi.Script(code_text).complete(line, col)
        return json.dumps([{
            "label": c.name,
            "kind": c.type,
            "detail": c.description,
            "documentation": c.docstring(),
            "insertText": c.name
        } for c in completions[:50]])
    except Exception as e:
        return json.dumps({"error": str(e)})
`);
    getCompletionsFn = pyodide.globals.get("_get_completions");
    self.postMessage({ type: "status", status: "ready" });
})();

self.onmessage = async (event) => {
    await initPromise;
    const { type } = event.data;
    if (type === "run") {
        if (isRunning) return;
        isRunning = true;
        const { code, sab, interruptSab } = event.data;
        const int32 = new Int32Array(sab);
        const uint8 = new Uint8Array(sab, 8);
        int32[0] = 0;
        int32[1] = 0;
        const interruptBuf = new Uint8Array(interruptSab);
        interruptBuf[0] = 0;
        pyodide.setInterruptBuffer(interruptBuf);
        pyodide.globals.set("_js_input", (prompt_text) => {
            flush(true);
            self.postMessage({ type: "input_request", prompt: prompt_text });
            Atomics.wait(int32, 0, 0);
            const signal = Atomics.load(int32, 0);
            Atomics.store(int32, 0, 0);
            if (signal === 2) throw new Error("KeyboardInterrupt");
            const len = int32[1];
            int32[1] = 0;
            return new TextDecoder().decode(uint8.slice(0, len));
        });
        pyodide.globals.set("_user_code", code);
        try {
            await pyodide.runPythonAsync(`
import builtins
builtins.input = _js_input
exec(_user_code, {})
`);
        } catch (err) {
            const msg = String(err?.message ?? err);
            if (!msg.includes("KeyboardInterrupt") && !msg.includes("Interrupted")) {
                stderrBuf += msg + "\n";
            } else {
                stderrBuf += "\n[Выполнение прервано]\n";
            }
        } finally {
            flush(true);
            interruptBuf[0] = 0;
            isRunning = false;
            self.postMessage({ type: "status", status: "done" });
        }
    }
    if (type === "get_hints") {
        const { id, code, line, column } = event.data;
        if (isRunning || !getCompletionsFn) {
            self.postMessage({ type: "hints", id, completions: [] });
            return;
        }
        try {
            const raw = getCompletionsFn(code, line, column);
            const parsed = JSON.parse(raw);
            self.postMessage({ type: "hints", id, completions: Array.isArray(parsed) ? parsed : [] });
        } catch {
            self.postMessage({ type: "hints", id, completions: [] });
        }
    }
};
