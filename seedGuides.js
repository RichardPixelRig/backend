import mongoose from "mongoose";
import dotenv from "dotenv";
import Guide from "./models/Guide.js";

dotenv.config();

const guides = [
  {
    title: "RGB Lighting Without Going Overboard",
    content: `RGB is one of those things that looks amazing when it's done right and absolutely terrible when it's not. The difference between a clean build and a mess is usually just restraint.

Pick a colour scheme and stick to it. Seriously. Cyan and white looks great. Red and black looks great. Everything cycling through every colour at once looks like a toy from Argos. Most RGB software like Aura Sync, iCUE, or Mystic Light will let you lock everything to one colour across all your components, so use that.

Not everything needs to be RGB either. Fans you can see through the glass panel, RAM, your keyboard and mouse are worth doing. The RGB strip stuck to the back of your desk that nobody sees? Skip it.

The thing most people don't think about is diffusion. Direct LEDs look cheap and harsh. Fans with diffuser rings like the Lian Li Uni Fan spread the light evenly and actually look premium. If you're doing strips inside the case, bounce the light off a white interior surface rather than pointing it straight at the viewer.

If you're mixing brands, OpenRGB is free and controls pretty much everything from one place without the usual bloatware fight between iCUE and Aura trying to kill each other.

One last thing: turn the brightness down. 40 to 60 percent looks way better than full blast. At night especially, a subtle glow is infinitely more satisfying than having your room look like a Vegas casino.`,
  },
  {
    title: "Troubleshooting Boot Problems",
    content: `Your PC won't turn on or won't get past a black screen. Before you panic and assume something is dead, work through this. Most boot issues are something simple.

First check the obvious stuff. Is your monitor plugged into the GPU and not the motherboard? If you have a dedicated graphics card installed, the motherboard video output is disabled. It catches everyone out at least once.

If you're getting nothing at all, no beeps, no POST screen, the most common culprit is RAM. Pull both sticks out, give the contacts a wipe with a dry cloth, and put just one stick in slot A2. That's usually the second slot from the CPU so check your manual. Try that before anything else.

If that doesn't sort it, clear the CMOS. There's either a jumper on the board or a small watch battery you can pop out for 30 seconds. This resets everything back to default BIOS settings and fixes a surprising number of weird issues.

Also check your CPU power cable. There's a separate 8-pin connector near the top of the motherboard that people sometimes miss when they're rushing the build. If that's not in, you're not getting anywhere.

If you're getting to BIOS but Windows won't load, your drive probably isn't set as the boot device. Go into BIOS, find the boot order settings, and make sure your SSD or NVMe is first. If the drive doesn't even show up, reseat it. NVMe cards especially can look seated when they're not quite in.

Blue screens after booting usually come down to RAM instability, a dodgy overclock, or thermals. Run Windows Memory Diagnostic, reset any overclocks, and check your temps with HWiNFO64. If your CPU or GPU is hitting 100 degrees it's going to cause chaos.

Most modern motherboards have a little debug display showing a two-digit code. Your manual will tell you exactly what it means and point you straight at the faulty component.`,
  },
  {
    title: "Optimising Your Gaming Setup for Performance",
    content: `Before you spend money on new hardware, there's a good chance you're leaving performance on the table with your current setup. These changes are free and some of them make a genuinely noticeable difference.

The biggest one that almost nobody does is enabling XMP or EXPO in BIOS. Your RAM probably runs at 2133MHz by default even if you paid for 6000MHz sticks. Go into BIOS, find the XMP or EXPO option, and enable the profile. On AMD systems especially this can improve gaming performance by 10 to 20 percent. It's the single best free upgrade you can make.

Change your Windows power plan to High Performance or Ultimate Performance. You can enable the Ultimate Performance plan by opening PowerShell and running: powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61. This stops Windows throttling the CPU when it thinks you're idle between frames.

In Windows Settings, turn on Game Mode and Hardware-Accelerated GPU Scheduling. The second one reduces latency between your CPU and GPU and is worth having on if your hardware supports it, which means RTX 10 series or RX 5000 series and above.

In Nvidia Control Panel, set Power Management Mode to Prefer Maximum Performance and turn off Vsync there, using the in-game setting instead. AMD users should enable Anti-Lag and Radeon Boost in Radeon Software for competitive games.

If your CPU and GPU both support Resizable BAR (Nvidia calls it ReBAR, AMD calls it Smart Access Memory), enable it in BIOS. It's usually under PCI subsystem settings and gives a solid performance bump in most games.

Go to Task Manager, click Startup, and disable everything you don't need launching when Windows boots. Discord, OneDrive, Teams, Spotify all add up. Open them manually when you need them.

For in-game settings, the biggest performance hits come from shadow quality, ambient occlusion, volumetric effects, and reflections. Drop those first. And if your game supports DLSS, FSR, or XeSS, use it. You'll get more frames with better image quality than native TAA.`,
  },
  {
    title: "Top 10 Budget PC Builds of 2025",
    content: `You genuinely do not need to spend a lot to build something great right now. The mid-range has never been better value and even the budget end is surprisingly capable.

Around £300 to £350 you can put together a proper 1080p esports machine. A Ryzen 5 5600 (around £80), an RX 6600 (around £120), 16GB of DDR4 3200MHz, a B550 board, 500GB NVMe, a decent 550W PSU and a basic case. That build will run Valorant, CS2, Fortnite and Apex at well over 144fps on high settings. The 5600 and 6600 together is one of the most underrated combos going.

Spend £500 to £550 and things get seriously good. Move to a Ryzen 5 7600 and either an RTX 4060 or RX 7600 XT, pair it with 16GB DDR5 at 6000MHz on a B650 board, and you've got a platform with years of upgrade headroom. This tier handles 1440p 144fps in esports titles and 1080p high settings in anything modern.

At £800 to £900 you're getting into genuinely high-end territory for the money. A Ryzen 7 7700X with an RTX 4070 Super is one of the best gaming combos available right now. You're looking at 1440p ultra at 144fps in virtually everything and capable 4K in less demanding titles. The 4070 Super especially is just absurd value for what it delivers.

A few things worth keeping in mind across all budgets: always buy RAM as a matched kit rather than a single stick, never cut corners on the PSU because a cheap one can destroy your entire build, and second-hand GPUs from the 3000 and 6000 series are absolutely worth looking at if you're trying to stretch the budget further.`,
  },
  {
    title: "How to Benchmark Your Build Like a Pro",
    content: `Benchmarking isn't just for showing off scores. It's how you confirm your hardware is actually running properly, catch problems before they become bigger ones, and verify your overclock is stable.

Start with HWiNFO64. Run it in sensor-only mode in the background any time you're doing a benchmark. It tracks everything: CPU and GPU temperatures, clock speeds, power draw, fan speeds. If something is throttling or running hotter than it should, this will tell you.

For GPU benchmarks, 3DMark Time Spy is the standard. It's DirectX 12, well optimised, and has a massive database of results so you can compare your score directly against other people running the same card. If you're 15 percent or more below average for your GPU, something is wrong. It's usually thermal throttling, power limits, or a driver issue.

Unigine Superposition is better for stress testing. It hammers the GPU hard for an extended period, which is useful for checking if your card stays stable under sustained load rather than just during a short benchmark burst.

For CPU, Cinebench R23 or R24 gives you single-core and multi-core scores you can compare against verified results for your exact processor. Prime95 on Small FFTs is the most brutal stability test available. If your system survives 30 minutes without crashing or thermal throttling, your CPU cooling is solid. Keep an eye on temps since most CPUs should stay under 90 degrees under Prime95.

CrystalDiskMark is worth running on any new storage. It'll confirm your NVMe is hitting its rated sequential speeds. If a Gen 4 drive is only showing Gen 3 speeds, either the slot doesn't support Gen 4 or XMP is affecting the PCIe lane configuration.

After any overclock, do everything in sequence: 3DMark first, then Cinebench, then Prime95 for half an hour, then a couple of hours in an actual game. If it gets through all of that without crashing or throttling, you're good.`,
  },
  {
    title: "Upgrading from SATA to NVMe",
    content: `If you're still running a SATA SSD as your main drive, upgrading to NVMe is one of the most noticeable improvements you can make without touching your CPU or GPU.

The numbers are hard to argue with. A SATA SSD tops out around 550MB/s. A Gen 3 NVMe does around 3500MB/s. Gen 4 hits 7000MB/s. In real world use that means faster Windows boot, noticeably quicker game loads (especially open world games that stream assets constantly), and dramatically faster large file transfers.

Before you buy anything, check your motherboard manual. Most boards have one or two M.2 slots but not all of them support NVMe. Some only support the slower SATA M.2 standard which uses the same connector but doesn't give you any speed benefit. Also check which PCIe generation your slots run. A Gen 4 drive in a Gen 3 slot will cap at Gen 3 speeds.

The good news is you almost certainly don't need to reinstall Windows. Get yourself a copy of Macrium Reflect Free, install the new NVMe drive in the M.2 slot (there's a small screw that holds the far end at an angle, don't overtighten it), boot into Windows and let it initialise but don't format it, then use Macrium to clone your SATA drive across to the NVMe. The clone takes anywhere from 20 minutes to an hour depending on how much data you have.

Once it's done, shut down, unplug the SATA drive, and boot. Go into BIOS and make sure the NVMe is set as the boot device if Windows doesn't load automatically. After you've confirmed everything works, you can reattach the SATA drive and use it for storage.

One thing to watch with Gen 4 and Gen 5 drives is heat. 70 to 80 degrees under sustained load is normal but thermal throttling will kill your speeds. Use the motherboard heatsink if you have one or pick up a cheap third-party M.2 heatsink for about £5.`,
  },
  {
    title: "How to Choose the Right GPU in 2025",
    content: `The GPU market in 2025 is genuinely good if you know where to look. There's strong competition at almost every price point and the mid-range especially is in a great place.

The most important thing is buying for your resolution. At 1080p, an RTX 4060 or RX 7600 XT is more than enough for most games and anything above that is honestly wasted money at that resolution. At 1440p, the RTX 4070 Super and RX 7800 XT are the sweet spot and both can push 144fps on high settings in virtually everything. For 4K you need to be looking at the RTX 4080 Super, RX 7900 XTX, or the new 5080 if budget allows.

Between Nvidia and AMD the honest answer is it depends what you use the card for. Nvidia's DLSS 4 is still better than FSR in most games, their NVENC encoder is excellent if you stream or record, and ray tracing performance is noticeably ahead. AMD on the other hand gives you more VRAM for the money at mid-range. The RX 7800 XT has 16GB versus the RTX 4070's 12GB and FSR works on any GPU so you're not locked into an ecosystem.

VRAM is quietly becoming more important. Modern AAA titles at 4K ultra are pushing 16GB. At 1440p you're fine with 12GB for now. At 1080p 8GB works today but if you're keeping the card for three or four years, 12GB gives you peace of mind.

On the upscaling front, all three main options (DLSS, FSR, XeSS) have gotten genuinely good. For competitive games where image quality matters less than frames, it's less relevant. For anything cinematic at high settings, turning on DLSS Quality or FSR Quality mode is an easy way to get more performance with minimal visual trade-off.

Second-hand is absolutely worth considering. An RTX 3080 or RX 6800 XT bought privately for a fair price is a genuinely excellent 1440p card. Just avoid anything that looks like it was used for mining and buy somewhere with buyer protection.`,
  },
  {
    title: "Beginner's Guide to Cable Management",
    content: `Cable management makes a bigger difference than most people expect, both for how the build looks and how it functions. Good airflow depends on cables not blocking it, and a tidy build is so much easier to work on later.

The tool you actually need is velcro cable ties, not zip ties. They're reusable, they don't cut into cables when you overtighten them, and you can undo them when you inevitably want to swap something six months from now.

The biggest mistake people make is trying to manage cables after everything is installed. Route your PSU cables first, before any components go in. Feed them through the back panel grommets and bring them through to where they're needed. The space behind the motherboard tray is where you hide everything. Coil up any excess length back there and bundle it with velcro.

If you have a modular PSU only plug in the cables you actually need. It sounds obvious but it makes a huge difference to how much you're fighting in the back of the case.

The front panel header cables are the fussiest part of any build. These are the tiny individual connectors for Power Switch, Reset Switch, and Power LED. Your motherboard manual will have a diagram showing exactly where each one goes. Take your time with it and use something small like a pen tip to guide them onto the pins.

For cable routing, do it in this order: 24-pin ATX and CPU 8-pin first, then GPU power cables, then SATA and storage cables, then the front panel and USB headers, then fan cables last since they're the shortest and most flexible.

If you really want to elevate the look, aftermarket sleeved cables make an enormous difference. CableMod make custom length cables in basically any colour. Match them to your build theme and it goes from looking like a PC to looking like something you'd see in a showcase.`,
  },
  {
    title: "Air vs Liquid Cooling: What's Best?",
    content: `This gets argued about constantly and the honest answer is less exciting than the debate suggests. For most people, a good air cooler is the right choice.

Air cooling is simple, reliable, and performs exceptionally well for the money. There are no failure modes beyond a fan dying, which is easily replaced. No pumps to worry about, no liquid anywhere near your components. A Thermalright Peerless Assassin 120 SE costs around £35 and will cool a 125W CPU to perfectly respectable temperatures while being nearly silent. A Noctua NH-D15 at around £80 competes with 360mm all-in-ones that cost twice as much.

The case for going liquid comes down to a few specific situations. If you're in an ITX case where there's no room for a tower cooler, an AIO is often the only option. If you're running something like a Ryzen 9 or an i9 with serious TDP, a 360mm AIO handles sustained loads better than most air coolers. And some people just want the clean look of a block and tubes versus a tower heatsink dominating the inside of the case.

If you do go AIO, size matters more than brand. A 240mm is roughly equivalent to a good dual tower air cooler and is fine for mid-range CPUs but not ideal for anything pushing 150W or above. A 360mm is where liquid cooling starts to genuinely pull ahead. The Arctic Liquid Freezer III is worth singling out as it's consistently the best value AIO on the market at both sizes.

What to avoid is a cheap no-name AIO under £40. They tend to run loud, the pump quality is poor, and they frequently underperform budget air coolers. If you're going liquid, spend enough to get something decent.

Whichever way you go, don't overthink the thermal paste. A pea-sized dot in the centre of the CPU spreads itself when you mount the cooler. Thermal Grizzly Kryonaut and Noctua NT-H1 are both excellent and the difference between pastes is much smaller than the internet makes it seem.`,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  await Guide.deleteMany({});
  console.log("Cleared existing guides");

  await Guide.insertMany(guides);
  console.log(`Seeded ${guides.length} guides`);

  await mongoose.disconnect();
  console.log("Done");
}

seed().catch(err => { console.error(err); process.exit(1); });
