import { beforeEach, describe, expect, it } from 'vitest'
import { getStore, reloadFromStorage, resetStore, STORAGE_KEY } from '@/lib/mock/store'

/**
 * 다른 탭이 localStorage를 바꿨을 때(예: storage 이벤트), 이 탭이 그 변경을
 * 실제로 읽어올 수 있는지 확인한다. getStore()는 한 번 읽은 뒤 메모리에
 * 캐시해 두므로, 이 탭 스스로 persist()를 부르지 않은 외부 변경은
 * reloadFromStorage()를 명시적으로 부르기 전까지는 반영되지 않는다.
 */
describe('reloadFromStorage — 다른 탭이 쓴 localStorage 반영', () => {
  beforeEach(() => resetStore())

  it('reloadFromStorage() 전에는 캐시된 값을 그대로 돌려준다', () => {
    const before = getStore()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...before, profiles: [] }))
    expect(getStore().profiles.length).toBeGreaterThan(0)
  })

  it('reloadFromStorage() 이후에는 localStorage의 최신 내용을 읽어온다', () => {
    const before = getStore()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...before, profiles: [] }))
    reloadFromStorage()
    expect(getStore().profiles.length).toBe(0)
  })
})
