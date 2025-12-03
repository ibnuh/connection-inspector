<script setup lang="ts">
type AbuseContact = {
  name?: string
  address?: string
  email?: string
  phone?: string
}

type DatacenterInfo = {
  datacenter?: string
  network?: string
  country?: string
  region?: string
  city?: string
}

type CompanyInfo = {
  name?: string
  abuser_score?: unknown
  domain?: string
  type?: string
  network?: string
  whois?: string
}

type AsnInfo = {
  asn?: number
  abuser_score?: unknown
  route?: string
  descr?: string
  country?: string
  active?: boolean
  org?: string
  domain?: string
  abuse?: string
  type?: string
  created?: string
  updated?: string
  rir?: string
  whois?: string
}

type LocationInfo = {
  is_eu_member?: boolean
  calling_code?: string
  currency_code?: string
  continent?: string
  country?: string
  country_code?: string
  state?: string
  city?: string
  latitude?: number
  longitude?: number
  zip?: string
  timezone?: string
  local_time?: string
  local_time_unix?: number
  is_dst?: boolean
}

type IpApiResponse = {
  ip?: string
  rir?: string
  is_bogon?: boolean
  is_mobile?: boolean
  is_satellite?: boolean
  is_crawler?: boolean
  is_datacenter?: boolean
  is_tor?: boolean
  is_proxy?: boolean
  is_vpn?: boolean
  is_abuser?: boolean
  datacenter?: DatacenterInfo
  company?: CompanyInfo
  abuse?: AbuseContact
  asn?: AsnInfo
  location?: LocationInfo
  elapsed_ms?: number
  client_rtt_ms?: number
}

interface DnsQueryResult {
  domain: string
  ip: string | null
  error?: string
}

interface DnsLeakResult {
  ok: boolean
  queries: DnsQueryResult[]
  systemDnsServers: string[]
  leakDetected: boolean
  resolverCount: number
  note?: string
  error?: string
}

const props = defineProps<{
  loadingIp: boolean
  ipInfo: IpApiResponse | null
  connectionType: string | null
  connectionDownlink: number | null
  connectionRtt: number | null
  connectionSaveData: boolean | null
  reverseDnsLoading: boolean
  reverseDnsError: string | null
  reverseDnsHostnames: string[] | null
  dnsLeakLoading: boolean
  dnsLeakError: string | null
  dnsLeakResult: DnsLeakResult | null
  fetchIpInfo: () => Promise<void> | void
  runReverseDnsLookup: () => Promise<void> | void
  runDnsLeakTest: () => Promise<void> | void
}>()

</script>

<template>
  <div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft">
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-slate-100">
          Network & IP details
        </h2>
        <p class="text-xs text-slate-400">
          Enriched data from
          <a
            href="https://api.ipapi.is/"
            target="_blank"
            rel="noreferrer"
            class="font-medium text-sky-400 underline-offset-4 hover:underline"
          >
            ipapi.is
          </a>
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[0.7rem] font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800 active:bg-slate-700"
        @click="props.fetchIpInfo"
      >
        <span v-if="props.loadingIp" class="mr-1.5 h-1.5 w-1.5 animate-ping rounded-full bg-sky-400" />
        Refresh
      </button>
    </div>

    <dl class="mt-2 space-y-2 text-xs">
      <IpTypeInfo :ip-info="props.ipInfo" />
      <BrowserConnection
        :connection-type="props.connectionType"
        :connection-downlink="props.connectionDownlink"
        :connection-rtt="props.connectionRtt"
        :connection-save-data="props.connectionSaveData"
      />
      <AbuseRiskInfo :ip-info="props.ipInfo" />
      <ProviderAsnInfo :ip-info="props.ipInfo" />
      <AbuseContactLocation :ip-info="props.ipInfo" />
      <ReverseDnsLookup
        :reverse-dns-loading="props.reverseDnsLoading"
        :reverse-dns-error="props.reverseDnsError"
        :reverse-dns-hostnames="props.reverseDnsHostnames"
        :run-reverse-dns-lookup="props.runReverseDnsLookup"
      />
      <DnsLeakTest
        :dns-leak-loading="props.dnsLeakLoading"
        :dns-leak-error="props.dnsLeakError"
        :dns-leak-result="props.dnsLeakResult"
        :run-dns-leak-test="props.runDnsLeakTest"
      />
      <RawIpPayload :ip-info="props.ipInfo" />
    </dl>
  </div>
</template>


