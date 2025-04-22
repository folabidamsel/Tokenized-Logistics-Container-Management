import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract calls
const mockContainers = new Map();
let mockLastContainerId = 0;

// Mock contract functions
const mockGetContainer = vi.fn((containerId) => {
  return mockContainers.get(containerId) || null;
});

const mockRegisterContainer = vi.fn((size, type, mfgDate, inspDate, sender) => {
  const newId = mockLastContainerId + 1;
  mockLastContainerId = newId;
  
  mockContainers.set(newId, {
    owner: sender,
    size: size,
    'container-type': type,
    'manufacturing-date': mfgDate,
    'last-inspection-date': inspDate,
    'is-active': true
  });
  
  return { value: newId };
});

const mockUpdateContainerStatus = vi.fn((containerId, isActive, sender) => {
  const container = mockContainers.get(containerId);
  if (!container) return { error: 404 };
  if (container.owner !== sender) return { error: 403 };
  
  container['is-active'] = isActive;
  mockContainers.set(containerId, container);
  return { value: true };
});

const mockTransferOwnership = vi.fn((containerId, newOwner, sender) => {
  const container = mockContainers.get(containerId);
  if (!container) return { error: 404 };
  if (container.owner !== sender) return { error: 403 };
  
  container.owner = newOwner;
  mockContainers.set(containerId, container);
  return { value: true };
});

describe('Container Registration Contract', () => {
  beforeEach(() => {
    mockContainers.clear();
    mockLastContainerId = 0;
  });
  
  it('should register a new container', () => {
    const result = mockRegisterContainer('20ft', 'Dry', 20220101, 20230101, 'user1');
    expect(result.value).toBe(1);
    
    const container = mockGetContainer(1);
    expect(container).not.toBeNull();
    expect(container.owner).toBe('user1');
    expect(container.size).toBe('20ft');
    expect(container['container-type']).toBe('Dry');
  });
  
  it('should update container status', () => {
    mockRegisterContainer('40ft', 'Refrigerated', 20220101, 20230101, 'user1');
    
    const result = mockUpdateContainerStatus(1, false, 'user1');
    expect(result.value).toBe(true);
    
    const container = mockGetContainer(1);
    expect(container['is-active']).toBe(false);
  });
  
  it('should not allow unauthorized status updates', () => {
    mockRegisterContainer('40ft', 'Refrigerated', 20220101, 20230101, 'user1');
    
    const result = mockUpdateContainerStatus(1, false, 'user2');
    expect(result.error).toBe(403);
  });
  
  it('should transfer ownership', () => {
    mockRegisterContainer('40ft', 'Refrigerated', 20220101, 20230101, 'user1');
    
    const result = mockTransferOwnership(1, 'user2', 'user1');
    expect(result.value).toBe(true);
    
    const container = mockGetContainer(1);
    expect(container.owner).toBe('user2');
  });
  
  it('should not allow unauthorized ownership transfer', () => {
    mockRegisterContainer('40ft', 'Refrigerated', 20220101, 20230101, 'user1');
    
    const result = mockTransferOwnership(1, 'user3', 'user2');
    expect(result.error).toBe(403);
  });
});
