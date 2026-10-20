import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { BottomNav } from '@/components/BottomNav'
import { StatusMessage } from '@/components/StatusMessage'
import { AppButton } from '@/components/AppButton'
import { callFunction } from '@/services/cloud'
import chinaProvinces from '@/data/chinaProvinces.json'
import type { ProvinceStat } from '@/types/domain'
import styles from './index.module.scss'

type Point = [number, number]
type Polygon = Point[][]
interface Feature {
  geometry: { type: string; coordinates: Polygon | Polygon[] }
  properties: { 地名: string; 区划码: string }
}
const features = chinaProvinces.features as unknown as Feature[]
const polygonsOf = (feature: Feature): Polygon[] => feature.geometry.type === 'Polygon'
  ? [feature.geometry.coordinates as Polygon] : feature.geometry.coordinates as Polygon[]
const points = features.flatMap(feature => polygonsOf(feature).flatMap(polygon => polygon.flat()))
const segmentKey = (start: Point, end: Point) => {
  const first = `${start[0].toFixed(5)},${start[1].toFixed(5)}`
  const second = `${end[0].toFixed(5)},${end[1].toFixed(5)}`
  return first < second ? `${first}|${second}` : `${second}|${first}`
}
const segmentCounts = new Map<string, { count: number; start: Point; end: Point }>()
features.forEach(feature => polygonsOf(feature).forEach(polygon => polygon.forEach(ring => {
  ring.forEach((start, index) => {
    const end = ring[(index + 1) % ring.length]
    const key = segmentKey(start, end)
    const current = segmentCounts.get(key)
    segmentCounts.set(key, current ? { ...current, count: current.count + 1 } : { count: 1, start, end })
  })
})))
const exteriorSegments = [...segmentCounts.values()].filter(segment => segment.count === 1)
const bounds = points.reduce((b, [x, y]) => ({ minX: Math.min(b.minX, x), maxX: Math.max(b.maxX, x), minY: Math.min(b.minY, y), maxY: Math.max(b.maxY, y) }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })
const insideRing = ([x, y]: Point, ring: Point[]) => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const boundaryHighlight = 'rgba(255, 250, 235, 0.9)'

export default function IndexPage() {
  const [stats, setStats] = useState<ProvinceStat[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')
  const [hoverCode, setHoverCode] = useState('')
  const [size, setSize] = useState({ width: 343, height: 310 })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [tooltip, setTooltip] = useState({ x: 16, y: 16 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null)
  const moved = useRef(false)
  const statMap = useMemo(() => new Map(stats.map(stat => [stat.code, stat])), [stats])
  const selected = statMap.get(selectedCode)
  const hovered = statMap.get(hoverCode)
  const formatCount = (stat?: ProvinceStat) => stat?.officialCountLabel || '待整理'
  const padding = 0
  const ratio = Math.min((size.width - padding * 2) / (bounds.maxX - bounds.minX), (size.height - padding * 2) / (bounds.maxY - bounds.minY))
  const left = (size.width - (bounds.maxX - bounds.minX) * ratio) / 2
  const top = (size.height - (bounds.maxY - bounds.minY) * ratio) / 2
  const project = ([x, y]: Point): Point => [
    (left + (x - bounds.minX) * ratio - size.width / 2) * scale + size.width / 2 + offset.x,
    (top + (bounds.maxY - y) * ratio - size.height / 2) * scale + size.height / 2 + offset.y,
  ]
  const shapes = features.map(feature => ({
    feature,
    polygons: polygonsOf(feature).map(polygon => polygon.map(ring => ring.map(project))),
  }))
  const exteriorLines = exteriorSegments.map(segment => ({
    start: project(segment.start),
    end: project(segment.end),
  }))

  const loadStats = () => {
    setLoading(true); setFailed(false)
    callFunction<{ items: ProvinceStat[] }>('getProvinceStats')
      .then(result => setStats(result.items))
      .catch(error => {
        console.error('[Map] 省份统计加载失败', error)
        setFailed(true)
      })
      .finally(() => setLoading(false))
  }
  useEffect(loadStats, [])
  useEffect(() => {
    const measure = () => Taro.nextTick(() => {
      Taro.createSelectorQuery().select('#province-map-viewport').boundingClientRect(rect => {
        if (rect && !Array.isArray(rect) && rect.width > 0 && rect.height > 0) {
          setSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
        }
      }).exec()
    })
    measure()
    Taro.onWindowResize(measure)
    return () => Taro.offWindowResize(measure)
  }, [])
  useEffect(() => {
    if (process.env.TARO_ENV !== 'weapp') return
    const context = Taro.createCanvasContext('china-province-map')
    context.clearRect(0, 0, size.width, size.height)
    shapes.forEach(({ feature, polygons }) => {
      context.setFillStyle(feature.properties.区划码 === selectedCode ? '#B9342B' : '#DCC9A2')
      polygons.forEach(polygon => {
        context.beginPath()
        polygon.forEach(ring => {
          ring.forEach(([x, y], i) => i === 0 ? context.moveTo(x, y) : context.lineTo(x, y))
          context.closePath()
        })
        context.fill()
        context.setStrokeStyle(boundaryHighlight)
        context.setLineWidth(0.85)
        context.stroke()
      })
    })
    context.setStrokeStyle('#A83A32')
    context.setLineWidth(2.2)
    context.beginPath()
    exteriorLines.forEach(({ start, end }) => {
      context.moveTo(start[0], start[1])
      context.lineTo(end[0], end[1])
    })
    context.stroke()
    context.draw()
  }, [size, scale, offset, selectedCode, stats])

  const begin = (x: number, y: number) => {
    drag.current = { x, y, ox: offset.x, oy: offset.y, moved: false }
    moved.current = false
    setHoverCode('')
  }
  const move = (x: number, y: number) => {
    const start = drag.current
    if (!start) return
    const dx = x - start.x; const dy = y - start.y
    if (Math.hypot(dx, dy) > 6) start.moved = true
    if (start.moved) { moved.current = true; setOffset({ x: start.ox + dx, y: start.oy + dy }) }
  }
  const end = () => { drag.current = null }
  const pick = (x: number, y: number) => {
    if (moved.current) return
    const hit = shapes.find(shape => shape.polygons.some(polygon => insideRing([x, y], polygon[0]) && !polygon.slice(1).some(ring => insideRing([x, y], ring))))
    if (hit) {
      const code = hit.feature.properties.区划码
      setSelectedCode(code)
      setHoverCode('')
      openPeople(code, hit.feature.properties.地名)
    }
  }
  const openPeople = (code = selectedCode, name = selected?.name) => {
    const stat = statMap.get(code)
    if (name) Taro.setStorageSync('peopleProvince', { code, name, scope: stat?.officialScope, note: stat?.note })
    Taro.reLaunch({ url: '/pages/people/index' })
  }

  return (
    <View className={styles.page}>
      <Image
        className={styles.pageBackdrop}
        src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20Chinese%20ink%20wash%20landscape%2C%20layered%20mountains%20and%20winding%20river%2C%20warm%20ivory%20rice%20paper%2C%20medium%20low%20contrast%2C%20misty%20mountain%20ranges%2C%20no%20people%2C%20no%20text%2C%20vertical%20historical%20scroll%20background&image_size=portrait_16_9"
        mode="aspectFill"
      />
      <View className={styles.pageWash} />
      <View className={styles.content}>
      <View className={styles.hero}>
        <Text className={styles.title}>英迹 · 山河英雄谱</Text>
        <Text className={styles.subtitle}>山河有记，人物有名</Text>
        <Text className={styles.heroNote}>循山河脉络，读英雄故事</Text>
      </View>
      <View className={styles.mapSection}>
        <View className={styles.mapIntro}>
          <Text className={styles.description}>点击省份查看统计与资料。待整理不等于 0 人。</Text>
          <View className={styles.legend}><View className={styles.goldDot} /><Text>省级行政区</Text><View className={styles.redDot} /><Text>已选省份</Text></View>
        </View>
        <View className={styles.mapStage}>
          <View
          id="province-map-viewport"
          className={styles.mapViewport}
          onTouchStart={event => {
            const touch = event.touches[0]
            if (touch) begin(touch.clientX, touch.clientY)
          }}
          onTouchMove={event => {
            const touch = event.touches[0]
            if (touch) move(touch.clientX, touch.clientY)
          }}
          onTouchEnd={event => {
            const touch = event.changedTouches[0]
            const wasMoved = moved.current
            end()
            if (process.env.TARO_ENV === 'weapp' && touch && !wasMoved) {
              Taro.createSelectorQuery().select('#province-map-viewport').boundingClientRect(rect => {
                if (rect && !Array.isArray(rect) && rect.width > 0 && rect.height > 0) {
                  pick(
                    (touch.clientX - rect.left) * size.width / rect.width,
                    (touch.clientY - rect.top) * size.height / rect.height,
                  )
                }
              }).exec()
            }
          }}
          onTouchCancel={end}
        >
          {process.env.TARO_ENV === 'weapp' ? (
            <Canvas canvasId="china-province-map" className={styles.mapCanvas} style={{ width: `${size.width}px`, height: `${size.height}px` }} />
          ) : (
            <svg className={styles.mapCanvas} viewBox={`0 0 ${size.width} ${size.height}`}
              onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); begin(event.clientX, event.clientY) }}
              onPointerMove={event => move(event.clientX, event.clientY)}
              onPointerUp={event => {
                const rect = event.currentTarget.getBoundingClientRect()
                const wasMoved = moved.current
                end()
                if (!wasMoved) pick((event.clientX - rect.left) * size.width / rect.width, (event.clientY - rect.top) * size.height / rect.height)
              }} onPointerCancel={end}
            >
              {shapes.map(({ feature, polygons }) => <React.Fragment key={feature.properties.区划码}>
                <path
                  d={polygons.map(polygon => polygon.map(ring => ring.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ') + ' Z').join(' ')).join(' ')}
                  fill={selectedCode === feature.properties.区划码 || hoverCode === feature.properties.区划码 ? '#B9342B' : '#DCC9A2'}
                  stroke={boundaryHighlight} strokeWidth={0.85} fillRule="evenodd" vectorEffect="non-scaling-stroke"
                onMouseEnter={event => {
                  if (drag.current) return
                  setHoverCode(feature.properties.区划码)
                  const rect = event.currentTarget.ownerSVGElement!.getBoundingClientRect()
                  setTooltip({ x: Math.max(8, Math.min(event.clientX - rect.left + 12, rect.width - 180)), y: Math.max(8, event.clientY - rect.top - 64) })
                }} onMouseLeave={() => setHoverCode('')}
              ><title>{feature.properties.地名}：{formatCount(statMap.get(feature.properties.区划码))}</title></path></React.Fragment>)}
              <g pointerEvents="none">
                {exteriorLines.map(({ start, end }, index) => (
                  <line
                    key={`${start[0]}-${start[1]}-${index}`}
                    x1={start[0]}
                    y1={start[1]}
                    x2={end[0]}
                    y2={end[1]}
                    stroke="#A83A32"
                    strokeWidth={2.2}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            </svg>
          )}
          {hovered && <View className={styles.tooltip} style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}><Text>{hovered.name}</Text><Text className={styles.tooltipCount}>{formatCount(hovered)}</Text></View>}
          </View>
          <View className={styles.southSea}><View className={styles.islandLine} /><View className={styles.islandLineShort} /><Text>南海诸岛</Text></View>
        </View>
        <Text className={styles.scopeNote}>氛围：1919-1949年 · 本平台已审核收录 · 按籍贯归属</Text>
        <View className={styles.controls}>
          <AppButton variant="secondary" disabled={scale >= 3} onClick={() => setScale(value => Math.min(3, value + .25))}>
            <View className={styles.controlInner}>
              <Text className={styles.controlIcon}>＋</Text>
              <Text className={styles.controlText}>放大</Text>
            </View>
          </AppButton>
          <AppButton variant="secondary" disabled={scale <= .75} onClick={() => setScale(value => Math.max(.75, value - .25))}>
            <View className={styles.controlInner}>
              <Text className={styles.controlIcon}>－</Text>
              <Text className={styles.controlText}>缩小</Text>
            </View>
          </AppButton>
          <AppButton variant="secondary" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}>
            <View className={styles.controlInner}>
              <Text className={styles.controlIcon}>↺</Text>
              <Text className={styles.controlText}>复原</Text>
            </View>
          </AppButton>
        </View>
        <Text className={styles.hint}>可拖动地图；轻触省份名称或人数，直接进入该省人物名单。</Text>
        {loading && <StatusMessage status="loading" />}
        {failed && <StatusMessage status="error" detail="省份统计暂时无法读取。" action="重试" onAction={loadStats} />}
      </View>
      <View className={styles.quickEntries}>
        <View className={styles.quickEntry} onClick={() => { Taro.removeStorageSync('peopleProvince'); Taro.reLaunch({ url: '/pages/people/index' }) }}>
          <Text className={styles.entryTitle}>人物名单</Text>
          <Text className={styles.entryText}>进入人物与事件检索</Text>
        </View>
        <View className={styles.quickEntry} onClick={() => Taro.navigateTo({ url: '/pages/statistics/index' })}>
          <Text className={styles.entryTitle}>统计口径</Text>
          <Text className={styles.entryText}>查看归属与去重规则</Text>
        </View>
      </View>
      </View>
      <BottomNav current="山河" />
    </View>
  )
}
