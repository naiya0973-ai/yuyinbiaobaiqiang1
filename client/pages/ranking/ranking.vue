<template>
  <view class="ranking-page">
    <!-- Period Selector -->
    <view class="period-tabs">
      <view
        v-for="tab in periods"
        :key="tab.value"
        class="period-tab"
        :class="{ active: currentPeriod === tab.value }"
        @click="currentPeriod = tab.value; fetchRanking()"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- Top 3 Podium -->
    <view v-if="rankingList.length >= 3" class="podium-section">
      <!-- #2 -->
      <view class="podium-item second"
      >
        <view class="rank-badge">2</view>
        <view class="podium-avatar"
        >
          <text>🥈</text>
        </view>
        <text class="podium-name">{{ rankingList[1].nickname }}</text>
        <text class="podium-score">{{ rankingList[1].hotScore }}热度</text>
      </view>

      <!-- #1 -->
      <view class="podium-item first"
      >
        <view class="rank-badge">1</view>
        <view class="podium-avatar"
        >
          <text>🥇</text>
        </view>
        <text class="podium-name">{{ rankingList[0].nickname }}</text>
        <text class="podium-score">{{ rankingList[0].hotScore }}热度</text>
      </view>

      <!-- #3 -->
      <view class="podium-item third"
      >
        <view class="rank-badge">3</view>
        <view class="podium-avatar"
        >
          <text>🥉</text>
        </view>
        <text class="podium-name">{{ rankingList[2].nickname }}</text>
        <text class="podium-score">{{ rankingList[2].hotScore }}热度</text>
      </view>
    </view>

    <!-- Ranking List -->
    <scroll-view
      scroll-y
      class="ranking-list"
      @scrolltolower="onLoadMore"
    >
      <view
        v-for="(item, index) in rankingList.slice(3)"
        :key="item.id"
        class="rank-item"
        @click="goToDetail(item.id)"
      >
        <text class="rank-num">{{ index + 4 }}</text>
        <view class="rank-content"
        >
          <text class="rank-title">{{ item.title || '无标题' }}</text>
          <view class="rank-meta"
          >
            <text class="rank-author">{{ item.nickname }}</text>
            <text class="rank-category">{{ item.categoryName }}</text>
          </view>
        </view>
        <view class="rank-stats"
        >
          <text class="hot-score">🔥 {{ item.hotScore }}</text>
          <text class="play-count">▶ {{ item.playCount }}</text>
        </view>
      </view>

      <view v-if="loading" class="load-more"
      >
        <text>加载中...</text>
      </view>

      <view v-else-if="noMore" class="load-more"
      >
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getHotRanking } from '@/api/ranking.js'

const periods = [
  { label: '日榜', value: 'day' },
  { label: '周榜', value: 'week' },
  { label: '月榜', value: 'month' },
  { label: '总榜', value: 'all' }
]

const currentPeriod = ref('all')
const rankingList = ref([])
const page = ref(1)
const limit = 20
const loading = ref(false)
const noMore = ref(false)

const fetchRanking = async (isLoadMore = false) => {
  if (loading.value) return
  loading.value = true

  try {
    if (!isLoadMore) {
      page.value = 1
      noMore.value = false
    }

    const data = await getHotRanking({
      period: currentPeriod.value,
      page: page.value,
      limit
    })

    if (isLoadMore) {
      rankingList.value.push(...data.list)
    } else {
      rankingList.value = data.list
    }

    if (data.list.length < limit) {
      noMore.value = true
    }
  } catch (err) {
    console.error('Fetch ranking error:', err)
  } finally {
    loading.value = false
  }
}

const onLoadMore = () => {
  if (noMore.value || loading.value) return
  page.value++
  fetchRanking(true)
}

const goToDetail = (id) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${id}`
  })
}

onMounted(() => {
  fetchRanking()
})
</script>

<style scoped>
.ranking-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.period-tabs {
  display: flex;
  background: #fff;
  padding: 20rpx 32rpx;
  gap: 20rpx;
}

.period-tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 32rpx;
  background: #f5f5f5;
  font-size: 28rpx;
  color: #666;
}

.period-tab.active {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fb3 100%);
  color: #fff;
  font-weight: bold;
}

.podium-section {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 60rpx 40rpx;
  background: linear-gradient(180deg, #fff 0%, #f5f5f5 100%);
  gap: 40rpx;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.podium-item.first {
  order: 2;
}

.podium-item.second {
  order: 1;
}

.podium-item.third {
  order: 3;
}

.rank-badge {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fb3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.podium-avatar {
  width: 120rpx;
  height: 120rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 16rpx;
  font-size: 60rpx;
}

.podium-item.first .podium-avatar {
  width: 160rpx;
  height: 160rpx;
  font-size: 80rpx;
}

.podium-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.podium-score {
  font-size: 24rpx;
  color: #ff6b9d;
}

.ranking-list {
  height: calc(100vh - 600rpx);
  padding: 0 20rpx;
}

.rank-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 24rpx 32rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.rank-num {
  width: 60rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #999;
  text-align: center;
}

.rank-content {
  flex: 1;
  margin-left: 20rpx;
}

.rank-title {
  display: block;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.rank-author {
  font-size: 24rpx;
  color: #666;
}

.rank-category {
  font-size: 22rpx;
  color: #ff6b9d;
  background: #fff0f3;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
}

.rank-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.hot-score {
  font-size: 26rpx;
  color: #ff6b9d;
  font-weight: bold;
}

.play-count {
  font-size: 22rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 40rpx;
  font-size: 26rpx;
  color: #999;
}
</style>
