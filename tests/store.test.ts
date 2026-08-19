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

/**
 * 실제 브라우저에서는 다른 탭이 localStorage를 바꾸면 이 탭에 네이티브
 * storage 이벤트가 온다. reloadFromStorage()를 각 화면이 일일이 불러야만
 * 반영되던 예전 방식은, 채팅방처럼 리스너를 달아둔 화면만 실시간으로
 * 동작하고 신청함·검색·네비게이션 배지 같은 나머지 화면은 여전히 예전
 * 캐시를 보여주는 문제가 있었다. store.ts가 스스로 storage 이벤트를
 * 구독해 캐시를 무효화하면, 어떤 화면이든 다음 getStore() 호출에서
 * 자동으로 최신값을 받는다.
 */
describe('storage 이벤트 자동 구독 — 화면이 reloadFromStorage()를 직접 안 불러도 반영된다', () => {
  beforeEach(() => resetStore())

  it('다른 탭이 쓴 것처럼 storage 이벤트를 흉내 내면, reloadFromStorage() 없이도 최신값을 읽어온다', () => {
    const before = getStore()
    const oldValue = JSON.stringify(before)
    const newValue = JSON.stringify({ ...before, profiles: [] })
    window.localStorage.setItem(STORAGE_KEY, newValue)

    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, oldValue, newValue }))

    expect(getStore().profiles.length).toBe(0)
  })

  it('다른 키에 대한 storage 이벤트는 무시한다', () => {
    const before = getStore()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...before, profiles: [] }))

    window.dispatchEvent(new StorageEvent('storage', { key: 'other-key', newValue: 'x' }))

    // 캐시가 무효화되지 않았으므로 여전히 이전 값을 돌려준다
    expect(getStore().profiles.length).toBeGreaterThan(0)
  })
})
