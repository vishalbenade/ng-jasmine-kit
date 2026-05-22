import { TestBed } from '@angular/core/testing';
import { WebSocketService, WsStatus } from './websocket.service';
import { createSpy } from '../../../testing/jasmine-kit';

function getHandler(mockSocket: Record<string, unknown>, event: string) {
  const calls = (mockSocket['addEventListener'] as jasmine.Spy).calls.all();
  const found = calls.find(c => c.args[0] === event);
  return found ? found.args[1] as (...args: unknown[]) => void : undefined;
}

describe('WebSocketService', () => {
  let service:    WebSocketService;
  let mockSocket: Record<string, unknown>;
  let wsSpy:      jasmine.Spy;

  beforeEach(() => {
    mockSocket = {
      send:             jasmine.createSpy('send'),
      close:            jasmine.createSpy('close'),
      addEventListener: jasmine.createSpy('addEventListener'),
      readyState:       WebSocket.OPEN,
    };

    wsSpy = spyOn(window, 'WebSocket').and.returnValue(
      mockSocket as unknown as WebSocket
    );

    TestBed.configureTestingModule({ providers: [WebSocketService] });
    service = TestBed.inject(WebSocketService);
  });

  afterEach(() => service.disconnect());

  it('sets status to "connecting" on construction', () => {
    let status: WsStatus | undefined;
    service.status$.subscribe(s => (status = s));
    expect(status).toBe('connecting');
  });

  it('sets status to "connected" when socket opens', () => {
    let status: WsStatus | undefined;
    service.status$.subscribe(s => (status = s));
    getHandler(mockSocket, 'open')?.();
    expect(status).toBe('connected');
  });

  it('emits parsed messages from server', (done) => {
    service.messages$.subscribe(msg => {
      expect(msg).toEqual({ type: 'USER_UPDATED', payload: { id: 1 } });
      done();
    });
    getHandler(mockSocket, 'message')?.({
      data: JSON.stringify({ type: 'USER_UPDATED', payload: { id: 1 } }),
    });
  });

  it('silently drops malformed JSON messages', () => {
    const spy = jasmine.createSpy('next');
    service.messages$.subscribe(spy);
    getHandler(mockSocket, 'message')?.({ data: 'NOT_JSON{{{' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends JSON message when socket is open', () => {
    mockSocket['readyState'] = WebSocket.OPEN;
    service.send({ type: 'PING' });
    expect(mockSocket['send']).toHaveBeenCalledWith(JSON.stringify({ type: 'PING' }));
  });

  it('does not send when socket is not open', () => {
    mockSocket['readyState'] = WebSocket.CLOSED;
    service.send({ type: 'PING' });
    expect(mockSocket['send']).not.toHaveBeenCalled();
  });

  it('sets status to "disconnected" on abnormal close', () => {
    let status: WsStatus | undefined;
    service.status$.subscribe(s => (status = s));
    getHandler(mockSocket, 'close')?.({ code: 1006 });
    expect(status).toBe('disconnected');
  });

  it('does NOT reconnect on intentional close (code 1000)', (done) => {
    getHandler(mockSocket, 'close')?.({ code: 1000 });
    setTimeout(() => {
      expect(wsSpy).toHaveBeenCalledTimes(1);
      done();
    }, 1200);
  });

  it('closes socket with code 1000 on disconnect()', () => {
    service.disconnect();
    expect(mockSocket['close']).toHaveBeenCalledWith(1000, 'Client disconnected');
  });
});
