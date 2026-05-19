<template>
  <view class="app-container">
    <slot />
  </view>
</template>

<script>
export default {
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
/* Global styles */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
}

.app-container {
  min-height: 100vh;
}

/* Common utility classes */
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.text-primary {
  color: #FF6B9D;
}

.text-secondary {
  color: #999999;
}

.text-dark {
  color: #333333;
}

.bg-primary {
  background-color: #FF6B9D;
}

.bg-white {
  background-color: #FFFFFF;
}

.rounded {
  border-radius: 8px;
}

.rounded-lg {
  border-radius: 16px;
}

.shadow {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* Animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
