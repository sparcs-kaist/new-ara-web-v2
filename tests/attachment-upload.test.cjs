const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, imports, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, require: name => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    }, process: { env: {} }, File, AbortController, Date, Map, URL, crypto, ...globals,
  }, { filename: path });
  return exports;
}

function setup({ putStatuses = [200], completionStatuses = [200], now = { value: 1000 } } = {}) {
  const calls = [];
  let starts = 0;
  const http = { post: async (url, body, options) => {
    calls.push({ url, body, options });
    if (url === 'attachments/uploads/') {
      starts++;
      return { status: 201, data: { id: `session-${starts}`, upload_url: 'https://bucket.s3.amazonaws.com/signed', headers: { 'Content-Type': 'application/zip', 'If-None-Match': '*' }, expires_in: 900 } };
    }
    const status = completionStatuses.shift() ?? 200;
    if (status === 410) {
      assert.equal(options.validateStatus(410), true);
      return { status, data: {} };
    }
    if (status !== 200) throw Object.assign(new Error('Completion failed'), { response: { status } });
    return { status, data: { id: 42, file: 'https://cdn/file.zip' } };
  } };
  const api = load('src/lib/api/attachmentUpload.ts', { './http': { default: http } }, {
    Date: class extends Date { static now() { return now.value; } },
    fetch: async (url, options) => {
      calls.push({ url, ...options });
      const status = putStatuses.shift() ?? 200;
      if (status === 'network') throw new TypeError('Network failure');
      return { ok: status >= 200 && status < 300, status };
    },
  });
  return { ...api, calls, now };
}

const file = () => new File(['zip'], 'file.zip', { type: 'application/zip' });
const putCalls = calls => calls.filter(call => call.method === 'PUT');

test('expired presigned URL gets a new session on manual retry', async () => {
  const api = setup({ putStatuses: [403, 200] });
  const task = api.createAttachmentUpload({ file: file() });
  await assert.rejects(task.upload());
  api.now.value += 901000;
  assert.equal((await task.upload()).data.id, 42);
  assert.equal(api.calls.filter(call => call.url === 'attachments/uploads/').length, 2);
  assert.equal(putCalls(api.calls).length, 2);
  assert.equal(api.calls.at(-1).url, 'attachments/uploads/session-2/complete/');
});

test('completion retry never retransmits even after URL expiration', async () => {
  const api = setup({ completionStatuses: [503, 200] });
  const task = api.createAttachmentUpload({ file: file() });
  await assert.rejects(task.upload());
  api.now.value += 901000;
  assert.equal((await task.upload()).data.id, 42);
  assert.equal(putCalls(api.calls).length, 1);
  assert.equal(api.calls.filter(call => call.url === 'attachments/uploads/').length, 1);
  assert.equal(api.calls.filter(call => call.url === 'attachments/uploads/session-1/complete/').length, 2);
});

test('412 after uncertain PUT confirms via completion', async () => {
  const api = setup({ putStatuses: ['network', 412] });
  const task = api.createAttachmentUpload({ file: file() });
  await assert.rejects(task.upload());
  assert.equal((await task.upload()).data.id, 42);
  assert.equal(api.calls.at(-1).url, 'attachments/uploads/session-1/complete/');
  assert.equal(api.calls.filter(call => call.url === 'attachments/uploads/').length, 1);
});

for (const status of [409, 410]) {
  test(`completion ${status} fails visibly and manual retry starts a fresh session`, async () => {
    const api = setup({ putStatuses: [412, 200], completionStatuses: [status, 200] });
    const task = api.createAttachmentUpload({ file: file() });
    await assert.rejects(task.upload());
    assert.equal((await task.upload()).data.id, 42);
    assert.equal(api.calls.filter(call => call.url === 'attachments/uploads/').length, 2);
    assert.equal(putCalls(api.calls).length, 2);
    assert.equal(api.calls.at(-1).url, 'attachments/uploads/session-2/complete/');
  });
}

// Exercise async orchestration only. These hook stubs do not model React rendering.
function hookHarness() {
  const cleanups = [];
  const tasks = [];
  const react = {
    useState: initial => [initial, () => {}],
    useRef: current => ({ current }),
    useCallback: callback => callback,
    useEffect: callback => { cleanups.push(callback()); },
  };
  const hook = load('src/lib/useAttachmentUploads.ts', {
    react,
    './api/attachmentUpload': { createAttachmentUpload: () => {
      let resolve, reject;
      const promise = new Promise((success, failure) => { resolve = success; reject = failure; });
      const task = { upload: () => promise, cancel: () => { task.cancelled = true; }, resolve, reject };
      tasks.push(task);
      return task;
    } },
  });
  const added = [];
  return { ...hook, state: hook.useAttachmentUploads(files => added.push(...files)), tasks, added, cleanups };
}

test('removing one upload suppresses its late response and preserves another upload', async () => {
  const { state, tasks, added } = hookHarness();
  const upload = state.upload([file(), file()]);
  state.remove(state.filesRef.current[0]);
  assert.equal(tasks[0].cancelled, true);
  tasks[0].resolve({ data: { id: 41, file: 'https://cdn/removed' } });
  tasks[1].resolve({ data: { id: 42, file: 'https://cdn/kept' } });
  const result = await upload;
  assert.equal(result.length, 1);
  assert.equal(state.filesRef.current.length, 1);
  assert.equal(added.length, 1);
  assert.equal(added[0].key, '42');
});

test('manual retry replaces failed state with attachment and editor callback once', async () => {
  const { state, tasks, added } = hookHarness();
  const upload = state.upload([file()]);
  const key = state.filesRef.current[0].key;
  tasks[0].reject(new Error('Completion unavailable'));
  await upload;
  assert.equal(state.filesRef.current[0].status, 'failed');
  tasks[0].upload = async () => ({ data: { id: 42, file: 'https://cdn/file' } });
  await state.retry(key);
  assert.equal(state.filesRef.current[0].status, 'success');
  assert.equal(added.length, 1);
  assert.equal(added[0].key, '42');
});

test('unmount cancels pending tasks and suppresses late editor insertion', async () => {
  const { state, tasks, added, cleanups } = hookHarness();
  const upload = state.upload([file()]);
  cleanups.forEach(cleanup => cleanup?.());
  assert.equal(tasks[0].cancelled, true);
  tasks[0].resolve({ data: { id: 42, file: 'https://cdn/file' } });
  assert.equal((await upload).length, 0);
  assert.equal(added.length, 0);
});

function chatHarness(compact) {
  const slots = [];
  let cursor = 0;
  const react = {
    useState: initial => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef: initial => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect: () => {},
  };
  const messages = [];
  let attempts = 0;
  let sessions = 0;
  let rejectUpload;
  const pendingUpload = new Promise((resolve, reject) => { rejectUpload = reject; });
  const jsx = (type, props) => ({ type, props });
  const { default: ChatInput } = load('src/app/chat/components/ChatInput.tsx', {
    react: { default: react, ...react },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'react-dom': { createPortal: content => content },
    'next/image': { default: 'image' },
    'react-textarea-autosize': { default: 'textarea' },
    '@/lib/api/chat': {
      sendMessage: async (roomId, text) => { messages.push({ roomId, text }); },
      sendAttachmentMessage: async (...args) => { messages.push({ attachment: args }); },
    },
    '@/lib/api/attachmentUpload': { createAttachmentUpload: () => {
      sessions++;
      return {
        upload: () => ++attempts === 1 ? pendingUpload : Promise.resolve({ data: { id: 42, file: 'https://cdn/file' } }),
        cancel: () => {},
      };
    } },
    '@/lib/socket/chat': { chatSocket: {} },
    '@/app/web_view/_components/icons': {},
  }, { alert: () => {} });
  let nodes = [];
  const render = () => {
    cursor = 0;
    nodes = [];
    const visit = node => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object') return;
      nodes.push(node);
      visit(node.props?.children);
    };
    visit(ChatInput({ roomId: 7, myId: null, onMessageSent: () => {}, compact }));
  };
  const find = predicate => {
    const node = nodes.find(predicate);
    assert.ok(node, 'Expected chat control');
    return node.props;
  };
  return {
    render, find, messages, rejectUpload,
    get attempts() { return attempts; },
    get sessions() { return sessions; },
  };
}

for (const compact of [false, true]) {
  test(`chat (${compact ? 'compact' : 'desktop'}): failed upload permits text send and preserves attachment retry`, async () => {
    const chat = chatHarness(compact);
    chat.render();
    const textarea = () => chat.find(node => node.type === 'textarea');
    textarea().onChange({ target: { value: 'hello' } });
    chat.render();
    const selected = file();
    chat.find(node => node.type === 'input' && node.props.type === 'file' && node.props.accept !== 'image/*')
      .onChange({ target: { files: [selected], value: 'file.zip' } });
    const enter = () => textarea().onKeyDown({ key: 'Enter', nativeEvent: {}, preventDefault() {} });
    enter();
    assert.equal(chat.messages.length, 0, 'blocks even before state rerender');
    chat.render();
    enter();
    assert.equal(chat.messages.length, 0, 'blocks during upload');
    chat.rejectUpload(new Error('S3 failed'));
    await new Promise(resolve => setImmediate(resolve));
    chat.render();
    const send = chat.find(node => node.type === 'button' && node.props['aria-label']?.includes('전송'));
    assert.equal(send.disabled, false);
    await send.onClick();
    assert.equal(chat.messages.length, 1, 'text sends despite retained retry session');
    chat.render();
    textarea().onChange({ target: { value: 'second' } });
    chat.render();
    enter();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(chat.messages.length, 2, 'Enter also sends after upload failure');
    chat.render();
    chat.find(node => node.type === 'button' && node.props.children === '재시도').onClick();
    await new Promise(resolve => setImmediate(resolve));
    chat.render();
    assert.equal(chat.attempts, 2);
    assert.equal(chat.sessions, 1, 'retains failed session for completion-only retry');
    await chat.find(node => node.type === 'button' && node.props['aria-label']?.includes('전송')).onClick();
    assert.equal(chat.messages[2].attachment[3], 42);
  });
}
