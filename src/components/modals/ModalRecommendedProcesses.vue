<script setup lang="ts">
import { computed, inject, ref, watch, type Ref } from 'vue'
import {
  NButton, NCard, NCollapse, NCollapseItem, NIcon, NModal,
  useMessage
} from 'naive-ui'
import { 
  AllInclusiveSharp, CloseSharp
} from '@vicons/material'
import XivFARImage from '../custom-controls/XivFARImage.vue'
import ItemSpan from '../custom-controls/ItemSpan.vue'
import { type UserConfigModel } from '@/models/user-config'
import { type ItemInfo } from '@/tools/item'
import { XivJobs, type XivJob } from '@/assets/data'
import { CopyToClipboard } from '@/tools'

const t = inject<(text: string, ...args: any[]) => string>('t') ?? (() => { return '' })
// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const userConfig = inject<Ref<UserConfigModel>>('userConfig')!
const NAIVE_UI_MESSAGE = useMessage()
  
const showModal = defineModel<boolean>('show', { required: true })
const expandedBlocks = ref<Record<number, string[]>>({})

watch(showModal, async(newVal, oldVal) => {
  if (newVal && !oldVal) {
    expandedBlocks.value = {}
    for (let i = 0; i < itemGroups.value.length; i++) {
      expandedBlocks.value[i] = ['1']
    }
  }
})

interface RecommendedProcessesProps {
  craftTargets: ItemInfo[],
  lv1Items: ItemInfo[],
  lv2Items: ItemInfo[],
  lv3Items: ItemInfo[],
  lvBaseItems: ItemInfo[]
}
const props = defineProps<RecommendedProcessesProps>()

const itemGroups = computed(() => {
  const itemsGatheredByBotanist : ItemInfo[] = []
  const itemsGatheredByMiner : ItemInfo[] = []
  const aethersands : ItemInfo[] = []
  const itemsTradable : ItemInfo[] = []
  const itemsOtherCollectable : ItemInfo[] = []
  const itemsPrePrePrecraft : Record<number, ItemInfo[]> = {}
  const itemsPrePrecraft : Record<number, ItemInfo[]> = {}
  const itemsPrecraft : Record<number, ItemInfo[]> = {}
  const itemsTarget : Record<number, ItemInfo[]> = {}

  // 从基础素材中检索分类
  props.lvBaseItems.forEach(item => {
    if (item.gatherInfo?.jobId) {
      if (item.gatherInfo.jobId === 17) {
        itemsGatheredByBotanist.push(item)
      } else if (item.gatherInfo.jobId === 16) {
        itemsGatheredByMiner.push(item)
      }
    } else if (item.canReduceFrom?.length) {
      aethersands.push(item)
    } else if (item.tradeInfo?.costGlobal) {
      // 部分道具同时具备可采集/精选和可兑换的属性，需要注意区分
      itemsTradable.push(item)
    } else {
      if (item.uiTypeId !== 59) {
        // 忽略水晶
        itemsOtherCollectable.push(item)
      }
    }
  })

  // 逐级遍历半成品
  props.lv1Items.forEach(item => {
    if (item.craftInfo?.jobId) {
      dealCraftableItem(itemsPrecraft, item)
    }
  })
  props.lv2Items.forEach(item => {
    if (item.craftInfo?.jobId) {
      dealCraftableItem(itemsPrePrecraft, item)
    }
  })
  props.lv3Items.forEach(item => {
    if (item.craftInfo?.jobId) {
      dealCraftableItem(itemsPrePrePrecraft, item)
    }
  })

  // 最终处理成品
  props.craftTargets.forEach(item => {
    if (item.craftInfo?.jobId) {
      dealCraftableItem(itemsTarget, item)
    }
  })

  // 根据处理后的物品列表组装各个分组
  const groups : {
    title: string,
    icon: string,
    description?: string,
    items: ItemInfo[]
  }[] = []
  if (itemsGatheredByMiner.length) {
    const job = itemsGatheredByMiner[0].gatherInfo!.jobId
    groups.push({
      title: t('使用{job}采集', getJobName(XivJobs[job])),
      icon: XivJobs[job].job_icon_url,
      items: itemsGatheredByMiner
    })
  }
  if (itemsGatheredByBotanist.length) {
    const job = itemsGatheredByBotanist[0].gatherInfo!.jobId
    groups.push({
      title: t('使用{job}采集', getJobName(XivJobs[job])),
      icon: XivJobs[job].job_icon_url,
      items: itemsGatheredByBotanist
    })
  }
  if (aethersands.length) {
    groups.push({
      title: t('筹集灵砂'),
      icon: './ui/reduce.png',
      items: aethersands
    })
  }
  if (itemsTradable.length) {
    groups.push({
      title: t('兑换道具'),
      icon: './ui/important-item.png',
      items: itemsTradable
    })
  }
  if (itemsOtherCollectable.length) {
    groups.push({
      title: t('筹集其他需要的道具'),
      icon: './ui/bag.png',
      items: itemsOtherCollectable
    })
  }
  Object.keys(itemsPrePrePrecraft).forEach(_jobID => {
    const jobId = Number(_jobID)
    const job = XivJobs[jobId]
    groups.push({
      title: t('使用{job}制作半半半成品', getJobName(job)),
      icon: job.job_icon_url,
      items: itemsPrePrePrecraft[jobId]
    })
  })
  Object.keys(itemsPrePrecraft).forEach(_jobID => {
    const jobId = Number(_jobID)
    const job = XivJobs[jobId]
    groups.push({
      title: t('使用{job}制作半半成品', getJobName(job)),
      icon: job.job_icon_url,
      items: itemsPrePrecraft[jobId]
    })
  })
  Object.keys(itemsPrecraft).forEach(_jobID => {
    const jobId = Number(_jobID)
    const job = XivJobs[jobId]
    groups.push({
      title: t('使用{job}制作半成品', getJobName(job)),
      icon: job.job_icon_url,
      items: itemsPrecraft[jobId]
    })
  })
  Object.keys(itemsTarget).forEach(_jobID => {
    const jobId = Number(_jobID)
    const job = XivJobs[jobId]
    groups.push({
      title: t('使用{job}制作成品', getJobName(job)),
      icon: job.job_icon_url,
      items: itemsTarget[jobId]
    })
  })

  return groups

  function dealCraftableItem(target: Record<number, ItemInfo[]>, item: ItemInfo) {
    const jobId = item.craftInfo!.jobId
    target[jobId] ??= []
    const existing = target[jobId].find(_item => item.id === _item.id)
    if (existing) {
      existing.amount += item.amount
    } else {
      target[jobId].push(item)
    }
  }
})

const itemLanguage = computed(() => {
  if (userConfig.value.language_item !== 'auto') {
    return userConfig.value.language_item
  }
  return userConfig.value.language_ui
})
const getItemName = (itemInfo: ItemInfo) => {
  switch (itemLanguage.value) {
    case 'ja':
      return itemInfo.nameJA
    case 'en':
      return itemInfo.nameEN
    case 'zh':
    default:
      return itemInfo.nameZH || '未翻译的物品'
  }
}
const getJobName = (jobInfo: XivJob) => {
  switch (userConfig.value.language_ui) {
    case 'ja':
      return jobInfo?.job_name_ja || t('未知')
    case 'en':
      return jobInfo?.job_name_en || t('未知')
    default:
      return jobInfo?.job_name_zh || t('未知')
  }
}

const handleClose = () => {
  showModal.value = false
}

const handleCopy = async (content: string, successMessage?: string) => {
  const container = document.getElementById('modal-recomm-process')
  const response = await CopyToClipboard(content, container)
  if (response) {
    NAIVE_UI_MESSAGE.error(t('复制失败：发生意外错误'))
  } else {
    NAIVE_UI_MESSAGE.success(successMessage ?? t('已复制到剪贴板'))
  }
}

const isBlocksAllCollapsed = () => {
  let allCollapsed = true
  for (let i = 0; i < itemGroups.value.length; i++) {
    if (expandedBlocks.value[i] && expandedBlocks.value[i].length > 0) {
      allCollapsed = false
    }
  }
  return allCollapsed
}
const handleCollapseOrUncollapseAllBlocks = () => {
  const allCollapsed = isBlocksAllCollapsed()
  for (let i = 0; i < itemGroups.value.length; i++) {
    expandedBlocks.value[i] = allCollapsed ? ['1'] : []
  }
}
const handleCopyProcesses = () => {
  const text = itemGroups.value.map((group, index) => {
    return (index+1) + '. ' + group.title + ':\n' + group.items.map(item => {
      return '  ' + getItemName(item) + ' x' + item.amount
    }).join('\n')
  }).join('\n\n')
  handleCopy(text)
}
</script>

<template>
  <n-modal v-model:show="showModal">
    <n-card
      closable
      role="dialog"
      id="modal-recomm-process"
      class="no-select"
      style="width: 98%; max-width: 350px;"
      @close="handleClose"
    >
      <template #header>
        <div class="card-title">
          <n-icon><AllInclusiveSharp /></n-icon>
          <span class="title">{{ t('推荐流程') }}</span>
          <div class="card-title-actions">
            <a href="javascript:void(0);" @click="handleCollapseOrUncollapseAllBlocks">[{{ isBlocksAllCollapsed() ? t('全部展开') : t('全部折叠') }}]</a>
            <a href="javascript:void(0);" @click="handleCopyProcesses">[{{ t('复制流程') }}]</a>
          </div>
        </div>
      </template>

      <div class="wrapper" ref="wrapper">
        <div
          class="block"
          v-for="(group, index) in itemGroups"
          :key="'group-' + index"
        >
          <n-collapse arrow-placement="right" v-model:expanded-names="expandedBlocks[index]">
            <n-collapse-item name="1">
              <template #header>
                <div class="title">
                  <span class="icon">
                    <XivFARImage
                      :size="14"
                      :src="group.icon"
                      class="no-select"
                    />
                  </span>
                  <span>
                    {{ index + 1 }}. {{ group.title }}
                  </span>
                </div>
              </template>

              <div class="description" v-if="group.description">{{ group.description }}</div>
          <div class="items">
            <ItemSpan
              v-for="item in group.items"
              :key="'item-' + item.id"
              :item-info="item"
              :amount="item.amount"
              show-amount
              container-id="modal-recomm-process"
            />
          </div>
            </n-collapse-item>
          </n-collapse>
          
          
        </div>
      </div>

      <template #action>
        <div class="submit-container">
          <n-button type="error" size="large" @click="handleClose">
            <template #icon>
              <n-icon><CloseSharp /></n-icon>
            </template>
            {{ t('关闭') }}
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
:deep(.n-card-header) {
  padding-bottom: 10px;
}
:deep(.n-card__action) {
  padding-top: 15px;
  padding-bottom: 15px;
}
:deep(.n-collapse-item__content-inner) {
  padding-top: 0 !important;
}

/* All */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 5px;
  user-select: text;
  max-height: 375px;
  overflow-y: auto;

  .block {
    line-height: 1.2;

    .title {
      display: flex;
      align-items: center;
      span {
        font-weight: bold;
      }
      span.icon {
        display: flex;
        margin-right: 3px;
      }
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin: 3px 0 0 1em;
    }
  }
}
.submit-container {
  display: flex;
  justify-content: flex-end;
}

/* Mobile only */
/* @media (max-width: 768px)*/
</style>