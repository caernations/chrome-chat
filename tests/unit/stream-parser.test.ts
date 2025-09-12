import { describe, it, expect, beforeEach } from 'vitest';
import { StreamParser } from '../../src/shared/utils/stream-parser';

describe('StreamParser', () => {
  let parser: StreamParser;

  beforeEach(() => {
    parser = new StreamParser();
  });

  it('should parse simple content chunk', () => {
    const chunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';
    
    const deltas = parser.parseChunk(chunk);
    
    expect(deltas).toHaveLength(1);
    expect(deltas[0]).toEqual({
      content: 'Hello',
      finished: false,
    });
  });

  it('should parse multiple chunks', () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
    ];
    
    const results = chunks.map(chunk => parser.parseChunk(chunk));
    
    expect(results[0][0].content).toBe('Hello');
    expect(results[1][0].content).toBe(' world');
  });

  it('should handle finish reason', () => {
    const chunk = 'data: {"choices":[{"finish_reason":"stop"}]}\n\n';
    
    const deltas = parser.parseChunk(chunk);
    
    expect(deltas).toHaveLength(1);
    expect(deltas[0]).toEqual({
      content: '',
      finished: true,
    });
  });

  it('should handle [DONE] signal', () => {
    const chunk = 'data: [DONE]\n\n';
    
    const deltas = parser.parseChunk(chunk);
    
    expect(deltas).toHaveLength(1);
    expect(deltas[0]).toEqual({
      content: '',
      finished: true,
    });
  });

  it('should handle partial chunks across calls', () => {
    const chunk1 = 'data: {"choices":[{"delta":';
    const chunk2 = '{"content":"Hello"}}]}\n\n';
    
    const deltas1 = parser.parseChunk(chunk1);
    const deltas2 = parser.parseChunk(chunk2);
    
    expect(deltas1).toHaveLength(0); 
    expect(deltas2).toHaveLength(1);
    expect(deltas2[0].content).toBe('Hello');
  });

  it('should ignore empty lines', () => {
    const chunk = '\n\ndata: {"choices":[{"delta":{"content":"Hello"}}]}\n\n\n';
    
    const deltas = parser.parseChunk(chunk);
    
    expect(deltas).toHaveLength(1);
    expect(deltas[0].content).toBe('Hello');
  });

  it('should reset buffer when reset is called', () => {
    const chunk1 = 'data: {"choices":[{"delta":';
    parser.parseChunk(chunk1);
    
    parser.reset();
    
    const chunk2 = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';
    const deltas = parser.parseChunk(chunk2);
    
    expect(deltas).toHaveLength(1);
    expect(deltas[0].content).toBe('Hello');
  });

  it('should throw StreamError for invalid JSON', () => {
    const chunk = 'data: {invalid json}\n\n';
    
    expect(() => parser.parseChunk(chunk)).toThrow();
  });
});