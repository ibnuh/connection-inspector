<script setup lang="ts">
type DatacenterInfo = {
  datacenter?: string
  network?: string
  country?: string
  city?: string
}

type CompanyInfo = {
  name?: string
  type?: string
  domain?: string
}

type AsnInfo = {
  asn?: number
  descr?: string
  route?: string
}

type IpApiResponse = {
  datacenter?: DatacenterInfo
  company?: CompanyInfo
  asn?: AsnInfo
}

const props = defineProps<{
  ipInfo: IpApiResponse | null
}>()
</script>

<template>
  <div
    v-if="props.ipInfo?.datacenter || props.ipInfo?.company || props.ipInfo?.asn"
    class="flex flex-col gap-2 rounded-lg bg-slate-950/60 px-3 py-2"
  >
    <dt class="text-[0.7rem] font-medium text-slate-300">Provider, ASN & datacenter</dt>
    <dd v-if="props.ipInfo?.company" class="mt-0.5 text-[0.72rem] text-slate-400">
      {{ props.ipInfo.company.name || 'Unknown provider' }}
      <span v-if="props.ipInfo.company.type">
        ({{ props.ipInfo.company.type }})
      </span>
      <span v-if="props.ipInfo.company.domain" class="text-slate-500">
        • {{ props.ipInfo.company.domain }}
      </span>
    </dd>
    <dd v-if="props.ipInfo?.datacenter" class="text-[0.7rem] text-slate-500">
      Datacenter:
      <span class="font-medium text-slate-300">
        {{ props.ipInfo.datacenter.datacenter || 'Unknown' }}
      </span>
      <span v-if="props.ipInfo.datacenter.city">
        • {{ props.ipInfo.datacenter.city }}
      </span>
      <span v-if="props.ipInfo.datacenter.country">
        , {{ props.ipInfo.datacenter.country }}
      </span>
      <span v-if="props.ipInfo.datacenter.network">
        • {{ props.ipInfo.datacenter.network }}
      </span>
    </dd>
    <dd v-if="props.ipInfo?.asn" class="text-[0.7rem] text-slate-500">
      <span>
        ASN {{ props.ipInfo.asn.asn ?? 'unknown' }} •
      </span>
      <span v-if="props.ipInfo.asn.descr">
        {{ props.ipInfo.asn.descr }}
      </span>
      <span v-if="props.ipInfo.asn.route">
        • {{ props.ipInfo.asn.route }}
      </span>
    </dd>
  </div>
</template>

