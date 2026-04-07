// Seed script: Lompoc businesses across all non-restaurant categories
// Run: node --env-file=.env.local db/seed-all-categories.mjs
//
// Non-destructive — uses ON CONFLICT DO NOTHING on slug.
// Categories covered: retail, services, health-beauty, auto, entertainment, other

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

// ---- RETAIL ----
const RETAIL = [
  {
    name: "Lompoc Valley Feed & Pet",
    slug: "lompoc-valley-feed-pet",
    description: "Full-service feed store and pet supply shop serving Lompoc since the 1970s — livestock feed, hay, pet food, and supplies.",
    address: "1440 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-5481",
    website: null,
    lat: 34.6383, lng: -120.4760,
  },
  {
    name: "Walmart Supercenter Lompoc",
    slug: "walmart-lompoc",
    description: "Full-service Walmart Supercenter with groceries, electronics, clothing, garden, and pharmacy.",
    address: "1100 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-7188",
    website: "https://www.walmart.com",
    lat: 34.6384, lng: -120.4710,
  },
  {
    name: "Target Lompoc",
    slug: "target-lompoc",
    description: "Target store on N H Street offering clothing, home goods, electronics, groceries, and a Starbucks café inside.",
    address: "1501 N H St, Lompoc, CA 93436",
    phone: "(805) 737-1300",
    website: "https://www.target.com",
    lat: 34.6575, lng: -120.4583,
  },
  {
    name: "Lompoc Furniture & Mattress",
    slug: "lompoc-furniture-mattress",
    description: "Locally owned furniture and mattress showroom offering sofas, bedroom sets, and mattresses at competitive prices.",
    address: "525 N H St, Lompoc, CA 93436",
    phone: "(805) 736-2511",
    website: null,
    lat: 34.6440, lng: -120.4583,
  },
  {
    name: "Big 5 Sporting Goods",
    slug: "big-5-lompoc",
    description: "Sporting goods chain with athletic footwear, apparel, outdoor gear, and team sports equipment.",
    address: "107 W Central Ave, Lompoc, CA 93436",
    phone: "(805) 735-1303",
    website: "https://www.big5sportinggoods.com",
    lat: 34.6410, lng: -120.4607,
  },
  {
    name: "HomeGoods Lompoc",
    slug: "homegoods-lompoc",
    description: "Off-price home décor retailer with a constantly changing selection of furniture, bedding, kitchen, and bath items.",
    address: "1107 N H St, Lompoc, CA 93436",
    phone: "(805) 737-3360",
    website: "https://www.homegoods.com",
    lat: 34.6517, lng: -120.4583,
  },
  {
    name: "Grocery Outlet Lompoc",
    slug: "grocery-outlet-lompoc",
    description: "Independently owned discount grocery store with name-brand food, beverages, and household products at steep discounts.",
    address: "324 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 735-5552",
    website: "https://www.groceryoutlet.com",
    lat: 34.6385, lng: -120.4636,
  },
  {
    name: "Smart & Final Extra Lompoc",
    slug: "smart-final-lompoc",
    description: "No-membership warehouse-style grocery store with bulk foods, produce, fresh meat, deli, and household supplies.",
    address: "116 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 735-8990",
    website: "https://www.smartandfinal.com",
    lat: 34.6384, lng: -120.4607,
  },
  {
    name: "Dollar Tree Lompoc",
    slug: "dollar-tree-lompoc",
    description: "Everything $1.25 or less — party supplies, cleaning products, snacks, seasonal décor, and more.",
    address: "112 W Central Ave, Lompoc, CA 93436",
    phone: "(805) 735-0950",
    website: "https://www.dollartree.com",
    lat: 34.6410, lng: -120.4608,
  },
  {
    name: "Ross Dress for Less Lompoc",
    slug: "ross-dress-lompoc",
    description: "Off-price department store with designer and name-brand clothing, shoes, handbags, and home décor.",
    address: "1107 N H St Ste 200, Lompoc, CA 93436",
    phone: "(805) 737-2818",
    website: "https://www.rossstores.com",
    lat: 34.6517, lng: -120.4584,
  },
]

// ---- SERVICES ----
const SERVICES = [
  {
    name: "Lompoc Post Office",
    slug: "lompoc-post-office",
    description: "USPS post office serving the Lompoc community — mail, packages, passport applications, and PO boxes.",
    address: "119 W Ocean Ave, Lompoc, CA 93438",
    phone: "(800) 275-8777",
    website: "https://www.usps.com",
    lat: 34.6385, lng: -120.4610,
  },
  {
    name: "Pacific Premier Bank Lompoc",
    slug: "pacific-premier-bank-lompoc",
    description: "Full-service community bank branch offering personal banking, business accounts, loans, and mortgages.",
    address: "1309 N H St, Lompoc, CA 93436",
    phone: "(805) 736-6100",
    website: "https://www.ppbi.com",
    lat: 34.6562, lng: -120.4583,
  },
  {
    name: "Wells Fargo Lompoc",
    slug: "wells-fargo-lompoc",
    description: "Wells Fargo bank branch with full retail banking, ATM, safe-deposit boxes, and mortgage services.",
    address: "200 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-3336",
    website: "https://www.wellsfargo.com",
    lat: 34.6386, lng: -120.4620,
  },
  {
    name: "Lompoc Valley Medical Center",
    slug: "lompoc-valley-medical-center",
    description: "Nonprofit community hospital providing emergency care, surgery, imaging, and specialty clinics for the Lompoc Valley.",
    address: "1515 E Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 737-3300",
    website: "https://www.lvmc.org",
    lat: 34.6385, lng: -120.4427,
  },
  {
    name: "H&R Block Lompoc",
    slug: "hr-block-lompoc",
    description: "Tax preparation services with year-round support, IRS audit assistance, and small-business bookkeeping.",
    address: "1009 N H St, Lompoc, CA 93436",
    phone: "(805) 736-9671",
    website: "https://www.hrblock.com",
    lat: 34.6500, lng: -120.4583,
  },
  {
    name: "UPS Store Lompoc",
    slug: "ups-store-lompoc",
    description: "Packing, shipping, mailbox services, printing, notary, and document shredding — one-stop business services hub.",
    address: "1007 W Ocean Ave Ste E, Lompoc, CA 93436",
    phone: "(805) 737-3010",
    website: "https://www.theupsstore.com",
    lat: 34.6384, lng: -120.4695,
  },
  {
    name: "Lompoc Public Library",
    slug: "lompoc-public-library",
    description: "Free public library with books, e-resources, children's programs, computer access, and community meeting rooms.",
    address: "501 E North Ave, Lompoc, CA 93436",
    phone: "(805) 875-8775",
    website: "https://www.cityoflompoc.com/government/departments/community-services/library",
    lat: 34.6414, lng: -120.4534,
  },
  {
    name: "FedEx Ship Center Lompoc",
    slug: "fedex-lompoc",
    description: "FedEx shipping, packing, printing, and freight services with extended drop-off hours.",
    address: "1302 N H St, Lompoc, CA 93436",
    phone: "(800) 463-3339",
    website: "https://www.fedex.com",
    lat: 34.6558, lng: -120.4583,
  },
  {
    name: "Lompoc Chamber of Commerce",
    slug: "lompoc-chamber",
    description: "The hub of the local business community — networking events, business referrals, ribbon cuttings, and advocacy.",
    address: "111 S I St, Lompoc, CA 93436",
    phone: "(805) 736-4567",
    website: "https://www.lompoc.org",
    lat: 34.6393, lng: -120.4590,
  },
  {
    name: "Snap Fitness Lompoc",
    slug: "snap-fitness-lompoc",
    description: "24/7 gym with cardio machines, free weights, group fitness classes, and personal training — no long-term contract required.",
    address: "124 W Central Ave, Lompoc, CA 93436",
    phone: "(805) 737-0023",
    website: "https://www.snapfitness.com",
    lat: 34.6409, lng: -120.4608,
  },
]

// ---- HEALTH & BEAUTY ----
const HEALTH_BEAUTY = [
  {
    name: "Salon Innovations",
    slug: "salon-innovations-lompoc",
    description: "Full-service hair salon on N H Street specializing in cuts, color, highlights, keratin treatments, and updos.",
    address: "1113 N H St, Lompoc, CA 93436",
    phone: "(805) 736-7778",
    website: null,
    lat: 34.6518, lng: -120.4583,
  },
  {
    name: "Fantastic Sam's Lompoc",
    slug: "fantastic-sams-lompoc",
    description: "Affordable walk-in hair salon offering cuts, color, perms, and extensions for the whole family.",
    address: "625 W Central Ave, Lompoc, CA 93436",
    phone: "(805) 735-3555",
    website: "https://www.fantasticsams.com",
    lat: 34.6413, lng: -120.4668,
  },
  {
    name: "Lompoc Dental Group",
    slug: "lompoc-dental-group",
    description: "General and cosmetic dentistry — cleanings, crowns, implants, teeth whitening, and emergency care.",
    address: "1221 N H St Ste 100, Lompoc, CA 93436",
    phone: "(805) 735-2895",
    website: null,
    lat: 34.6540, lng: -120.4583,
  },
  {
    name: "Rite Aid Lompoc",
    slug: "rite-aid-lompoc",
    description: "Pharmacy and wellness retailer with prescription filling, immunizations, beauty products, and health supplies.",
    address: "500 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-0714",
    website: "https://www.riteaid.com",
    lat: 34.6384, lng: -120.4655,
  },
  {
    name: "CVS Pharmacy Lompoc",
    slug: "cvs-lompoc",
    description: "Full-service pharmacy with MinuteClinic, flu shots, specialty prescriptions, photo lab, and beauty essentials.",
    address: "1506 N H St, Lompoc, CA 93436",
    phone: "(805) 736-8787",
    website: "https://www.cvs.com",
    lat: 34.6574, lng: -120.4583,
  },
  {
    name: "Pure Radiance Spa",
    slug: "pure-radiance-spa-lompoc",
    description: "Day spa offering facials, body wraps, waxing, massage, and lash extensions in a relaxing boutique setting.",
    address: "123 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 737-8800",
    website: null,
    lat: 34.6385, lng: -120.4613,
  },
  {
    name: "Elements Massage Lompoc",
    slug: "elements-massage-lompoc",
    description: "Therapeutic massage studio with Swedish, deep tissue, hot stone, prenatal, and sports massage by licensed therapists.",
    address: "103 W Central Ave, Lompoc, CA 93436",
    phone: "(805) 737-1220",
    website: "https://www.elementsmassage.com",
    lat: 34.6410, lng: -120.4604,
  },
  {
    name: "Lompoc Vision Center",
    slug: "lompoc-vision-center",
    description: "Independent optometry clinic offering eye exams, contact lens fittings, and a large selection of eyeglass frames.",
    address: "1028 N H St, Lompoc, CA 93436",
    phone: "(805) 736-9645",
    website: null,
    lat: 34.6503, lng: -120.4583,
  },
  {
    name: "Great Clips Lompoc",
    slug: "great-clips-lompoc",
    description: "Walk-in hair salon chain offering affordable haircuts for men, women, and children. Online check-in available.",
    address: "107 W Central Ave Ste H, Lompoc, CA 93436",
    phone: "(805) 735-0505",
    website: "https://www.greatclips.com",
    lat: 34.6410, lng: -120.4605,
  },
  {
    name: "Nails Lounge Lompoc",
    slug: "nails-lounge-lompoc",
    description: "Full-service nail salon offering manicures, pedicures, gel, acrylic, dipping powder, and nail art designs.",
    address: "325 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 735-9977",
    website: null,
    lat: 34.6385, lng: -120.4637,
  },
]

// ---- AUTO ----
const AUTO = [
  {
    name: "Lompoc Ford",
    slug: "lompoc-ford",
    description: "Ford new and pre-owned vehicle dealership with full service center, parts department, and financing.",
    address: "1700 N H St, Lompoc, CA 93436",
    phone: "(805) 736-1100",
    website: "https://www.lompocford.com",
    lat: 34.6601, lng: -120.4583,
  },
  {
    name: "Lompoc Honda",
    slug: "lompoc-honda",
    description: "Honda new and certified pre-owned vehicles with factory-trained technicians, OEM parts, and Honda financing.",
    address: "1512 N H St, Lompoc, CA 93436",
    phone: "(805) 737-7200",
    website: "https://www.lompochonda.com",
    lat: 34.6576, lng: -120.4583,
  },
  {
    name: "Jiffy Lube Lompoc",
    slug: "jiffy-lube-lompoc",
    description: "Quick oil change and preventive maintenance — oil changes, tire rotation, air filters, and wiper blades. No appointment needed.",
    address: "1300 N H St, Lompoc, CA 93436",
    phone: "(805) 735-2008",
    website: "https://www.jiffylube.com",
    lat: 34.6558, lng: -120.4583,
  },
  {
    name: "O'Reilly Auto Parts Lompoc",
    slug: "oreilly-auto-lompoc",
    description: "Auto parts retailer with a huge in-store selection, online ordering, free battery testing, and loaner tools.",
    address: "715 N H St, Lompoc, CA 93436",
    phone: "(805) 736-1290",
    website: "https://www.oreillyauto.com",
    lat: 34.6461, lng: -120.4583,
  },
  {
    name: "AutoZone Lompoc",
    slug: "autozone-lompoc",
    description: "Auto parts and accessories retailer with free battery testing, code reading, and oil recycling program.",
    address: "1103 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 737-1977",
    website: "https://www.autozone.com",
    lat: 34.6384, lng: -120.4713,
  },
  {
    name: "Pep Boys Lompoc",
    slug: "pep-boys-lompoc",
    description: "Auto parts, tires, and full-service repair — brakes, alignment, oil changes, AC service, and inspection.",
    address: "1400 N H St, Lompoc, CA 93436",
    phone: "(805) 737-2233",
    website: "https://www.pepboys.com",
    lat: 34.6570, lng: -120.4583,
  },
  {
    name: "Midas Lompoc",
    slug: "midas-lompoc",
    description: "Auto service franchise specializing in brakes, exhaust, oil changes, shocks and struts, and tire services.",
    address: "1208 N H St, Lompoc, CA 93436",
    phone: "(805) 736-6780",
    website: "https://www.midas.com",
    lat: 34.6541, lng: -120.4583,
  },
  {
    name: "Lompoc Car Wash & Detail",
    slug: "lompoc-car-wash-detail",
    description: "Full-service car wash with express exterior wash, hand wax, interior detailing, and monthly membership plans.",
    address: "924 N H St, Lompoc, CA 93436",
    phone: "(805) 736-2255",
    website: null,
    lat: 34.6490, lng: -120.4583,
  },
]

// ---- ENTERTAINMENT ----
const ENTERTAINMENT = [
  {
    name: "Regal Edwards Lompoc",
    slug: "regal-edwards-lompoc",
    description: "Multiplex cinema showing the latest Hollywood releases with stadium seating, digital projection, and a full concession stand.",
    address: "1521 N H St, Lompoc, CA 93436",
    phone: "(805) 737-3888",
    website: "https://www.regmovies.com",
    lat: 34.6578, lng: -120.4583,
  },
  {
    name: "Lompoc Valley Golf Course",
    slug: "lompoc-valley-golf-course",
    description: "Public 18-hole golf course set among the scenic Lompoc hills — pro shop, lessons, and weekend tournaments.",
    address: "4300 Club House Rd, Lompoc, CA 93436",
    phone: "(805) 733-3424",
    website: "https://www.lompocvalleygolfclub.com",
    lat: 34.6630, lng: -120.4302,
  },
  {
    name: "Vandenberg Space Force Base Visitor Center",
    slug: "vsfb-visitor-center",
    description: "Learn about Vandenberg's launch history with exhibits on rockets, satellites, and the base's role in US space missions.",
    address: "Vandenberg Space Force Base, Lompoc, CA 93437",
    phone: "(805) 606-3595",
    website: "https://www.vandenberg.spaceforce.mil",
    lat: 34.7527, lng: -120.5082,
  },
  {
    name: "Lompoc Museum",
    slug: "lompoc-museum",
    description: "Celebrating Lompoc's natural and cultural heritage — Chumash artifacts, military history, and rotating art exhibitions.",
    address: "200 S H St, Lompoc, CA 93436",
    phone: "(805) 736-3888",
    website: "https://www.lompocmuseum.org",
    lat: 34.6375, lng: -120.4581,
  },
  {
    name: "Dick DeWees Community & Senior Center",
    slug: "dick-dewees-community-center",
    description: "City-run community center hosting youth programs, senior activities, fitness classes, and event rentals.",
    address: "1120 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 875-8100",
    website: "https://www.cityoflompoc.com",
    lat: 34.6384, lng: -120.4718,
  },
  {
    name: "Lompoc Theatre",
    slug: "lompoc-theatre",
    description: "Historic downtown theater and performing arts venue hosting live music, comedy nights, and community productions.",
    address: "116 N H St, Lompoc, CA 93436",
    phone: "(805) 735-3535",
    website: null,
    lat: 34.6393, lng: -120.4584,
  },
  {
    name: "River Park Disc Golf Course",
    slug: "river-park-disc-golf",
    description: "Free 9-hole disc golf course at River Park — a favorite for families and frisbee enthusiasts of all skill levels.",
    address: "600 W Ocean Ave, Lompoc, CA 93436",
    phone: null,
    website: null,
    lat: 34.6384, lng: -120.4659,
  },
  {
    name: "Lompoc Aquatic Center",
    slug: "lompoc-aquatic-center",
    description: "Public indoor and outdoor pools with lap swim, water aerobics, swim lessons, and weekend open swim.",
    address: "510 W Laurel Ave, Lompoc, CA 93436",
    phone: "(805) 875-8100",
    website: "https://www.cityoflompoc.com",
    lat: 34.6370, lng: -120.4657,
  },
]

// ---- OTHER (local professionals, non-profits, unique services) ----
const OTHER = [
  {
    name: "Lompoc Flower Farm",
    slug: "lompoc-flower-farm",
    description: "One of the last working flower fields in Lompoc — u-pick lavender and wildflowers, farm tours, and seasonal bouquets.",
    address: "Rural Lompoc Valley, Lompoc, CA 93436",
    phone: "(805) 735-0000",
    website: null,
    lat: 34.6750, lng: -120.5000,
  },
  {
    name: "Lompoc Valley Humane Society",
    slug: "lompoc-valley-humane-society",
    description: "Animal shelter and adoption center — dogs, cats, and small animals looking for forever homes. Volunteer and donation opportunities.",
    address: "1300 E Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-3450",
    website: "https://www.lompocvalleyhumanesociety.com",
    lat: 34.6385, lng: -120.4453,
  },
  {
    name: "Kids' Space Children's Museum",
    slug: "kids-space-museum-lompoc",
    description: "Interactive hands-on museum for children ages 0–10 with science, arts, and dramatic-play exhibits.",
    address: "116 W Ocean Ave, Lompoc, CA 93436",
    phone: "(805) 736-1080",
    website: null,
    lat: 34.6384, lng: -120.4609,
  },
  {
    name: "Mission La Purísima",
    slug: "mission-la-purisima",
    description: "Completely restored Spanish colonial mission from 1787 — the most fully reconstructed of all 21 California missions. State park & living history site.",
    address: "2295 Purisima Rd, Lompoc, CA 93436",
    phone: "(805) 733-3713",
    website: "https://www.lapurisimamission.org",
    lat: 34.6726, lng: -120.4197,
  },
  {
    name: "Lompoc Veterans Memorial Building",
    slug: "lompoc-veterans-memorial",
    description: "Community event venue honoring local veterans — available for private events, meetings, and public gatherings.",
    address: "100 S I St, Lompoc, CA 93436",
    phone: "(805) 736-6461",
    website: null,
    lat: 34.6394, lng: -120.4591,
  },
  {
    name: "Santa Barbara County Animal Services Lompoc",
    slug: "sb-county-animal-services-lompoc",
    description: "County animal shelter serving the Lompoc region — stray animals, adoptions, licensing, and bite reporting.",
    address: "1501 W Central Ave, Lompoc, CA 93436",
    phone: "(805) 934-6461",
    website: "https://www.countyofsb.org/animalservices",
    lat: 34.6406, lng: -120.4748,
  },
]

// ---- DEALS ----
const DEALS = {
  // Retail
  "lompoc-valley-feed-pet": [
    { type: "coupon", title: "10% off any bag of dog food", description: "Any brand, any size. Mention Lompoc Deals at checkout.", discountText: "10% OFF", days: 30 },
  ],
  "walmart-lompoc": [
    { type: "announcement", title: "Weekly rollback specials", description: "New price rollbacks every week on groceries, electronics, and household items. Check in-store signs.", days: 7 },
  ],
  "target-lompoc": [
    { type: "special", title: "Circle Week deals up to 30% off", description: "Download the Target app and sign up for Target Circle to unlock exclusive weekly discounts.", discountText: "UP TO 30% OFF", days: 7 },
  ],
  "lompoc-furniture-mattress": [
    { type: "coupon", title: "$100 off any mattress set", description: "Queen, king, or full. Mention Lompoc Deals. Valid on in-stock mattresses only.", discountText: "$100 OFF", days: 30 },
  ],
  "big-5-lompoc": [
    { type: "special", title: "Buy one get one 50% off footwear", description: "Select athletic shoes. Mix and match. In-store only.", discountText: "BOGO 50%", days: 14 },
  ],
  "homegoods-lompoc": [
    { type: "announcement", title: "New arrivals every week", description: "Fresh home décor, furniture, and kitchen items arrive weekly — stop in to see what's new.", days: 7 },
  ],
  "grocery-outlet-lompoc": [
    { type: "special", title: "WOW deals on wine & spirits", description: "Premium wines and craft beer at below-wholesale prices. New stock weekly.", discountText: "SAVINGS", days: 14 },
  ],
  "ross-dress-lompoc": [
    { type: "announcement", title: "New markdowns every Monday", description: "Fresh designer and name-brand merchandise marked down each week. Early bird gets the deal.", days: 7 },
  ],

  // Services
  "hr-block-lompoc": [
    { type: "coupon", title: "$25 off tax preparation", description: "New clients only. Bring your prior-year return. Mention Lompoc Deals.", discountText: "$25 OFF", days: 60 },
  ],
  "ups-store-lompoc": [
    { type: "coupon", title: "15% off packing services", description: "We'll pack it for you — fragile items, artwork, or awkward shapes. Mention Lompoc Deals.", discountText: "15% OFF", days: 30 },
  ],
  "snap-fitness-lompoc": [
    { type: "special", title: "First month free — no contract", description: "Start your fitness journey with zero commitment. New members only. Mention Lompoc Deals.", discountText: "1ST MONTH FREE", days: 30 },
  ],

  // Health & Beauty
  "salon-innovations-lompoc": [
    { type: "coupon", title: "$10 off any color service", description: "Full color, highlights, or balayage. New clients only. Mention Lompoc Deals.", discountText: "$10 OFF", days: 30 },
  ],
  "fantastic-sams-lompoc": [
    { type: "coupon", title: "$5 off adult haircut", description: "Any adult cut. Walk-ins welcome. Mention Lompoc Deals.", discountText: "$5 OFF", days: 21 },
  ],
  "lompoc-dental-group": [
    { type: "coupon", title: "Free new patient exam & X-rays", description: "For uninsured new patients. Includes cleaning. Mention Lompoc Deals when you call.", discountText: "FREE", days: 60 },
  ],
  "rite-aid-lompoc": [
    { type: "special", title: "Wellness+ members save an extra 20%", description: "Sign up for free Wellness+ membership to unlock prescription savings and weekly sale bonuses.", discountText: "20% OFF", days: 30 },
  ],
  "pure-radiance-spa-lompoc": [
    { type: "coupon", title: "$15 off any facial service", description: "60-minute or longer facial. New clients only. Mention Lompoc Deals.", discountText: "$15 OFF", days: 30 },
    { type: "special", title: "Couples massage package — $120", description: "Two 60-minute massages. Perfect for date night or a gift. By appointment.", discountText: "$120", days: 30 },
  ],
  "elements-massage-lompoc": [
    { type: "coupon", title: "First session $59 (regularly $79)", description: "60-minute therapeutic massage. New clients only. All modalities available.", discountText: "$59 INTRO", days: 30 },
  ],
  "great-clips-lompoc": [
    { type: "coupon", title: "$5.99 haircut for kids under 10", description: "Must be accompanied by a paying adult. Walk-in or check in online.", discountText: "$5.99", days: 21 },
  ],
  "nails-lounge-lompoc": [
    { type: "coupon", title: "$5 off any full-set acrylic", description: "New clients only. Any shape or length. Mention Lompoc Deals.", discountText: "$5 OFF", days: 21 },
  ],

  // Auto
  "lompoc-ford": [
    { type: "special", title: "0% APR financing on select new Fords", description: "For qualified buyers. See dealer for terms. Limited-time offer on 2024 models.", discountText: "0% APR", days: 30 },
  ],
  "jiffy-lube-lompoc": [
    { type: "coupon", title: "$7 off Signature Service Oil Change", description: "Any vehicle. Print or show on phone. Valid on full-synthetic, synthetic blend, or conventional.", discountText: "$7 OFF", days: 30 },
  ],
  "oreilly-auto-lompoc": [
    { type: "special", title: "Free battery test & installation", description: "We'll test your battery and install a new one for free with purchase. No appointment needed.", discountText: "FREE", days: 30 },
  ],
  "autozone-lompoc": [
    { type: "coupon", title: "$20 off any purchase of $100+", description: "Online or in-store. Enter code or mention Lompoc Deals. Excludes gift cards.", discountText: "$20 OFF", days: 21 },
  ],
  "midas-lompoc": [
    { type: "coupon", title: "$29.99 oil change + tire rotation", description: "Conventional oil. Up to 5 quarts. Plus free brake inspection. Mention Lompoc Deals.", discountText: "$29.99", days: 30 },
  ],
  "lompoc-car-wash-detail": [
    { type: "coupon", title: "$5 off full interior detail", description: "Vacuum, wipe-down, and window cleaning included. Mention Lompoc Deals.", discountText: "$5 OFF", days: 21 },
    { type: "special", title: "Monthly unlimited wash — $25/mo", description: "Wash as often as you like. First month prorated. Cancel anytime.", discountText: "$25/MO", days: 30 },
  ],

  // Entertainment
  "regal-edwards-lompoc": [
    { type: "special", title: "Tuesday discount tickets — $6", description: "All standard showtimes on Tuesdays. Excludes 3D and premium formats. No code needed.", discountText: "$6 TUESDAYS", days: 30 },
  ],
  "lompoc-valley-golf-course": [
    { type: "coupon", title: "$5 off 18-hole green fee", description: "Weekdays only. Present at check-in. Mention Lompoc Deals.", discountText: "$5 OFF", days: 30 },
    { type: "special", title: "Twilight golf — $18 after 3pm", description: "Play as many holes as daylight allows. Cart not included.", discountText: "$18", days: 30 },
  ],
  "lompoc-museum": [
    { type: "special", title: "Free admission on first Sundays", description: "The museum offers free admission on the first Sunday of every month. Donations welcome.", discountText: "FREE", days: 30 },
  ],
  "lompoc-aquatic-center": [
    { type: "coupon", title: "10-swim punch card — $25", description: "Lap swim or open swim. Never expires. Purchase at the front desk.", discountText: "$25 FOR 10", days: 60 },
  ],

  // Other
  "lompoc-valley-humane-society": [
    { type: "special", title: "Adoption fee waived for senior pets", description: "Dogs and cats 7 years and older are free to adopt. Help a senior pet find their forever home.", discountText: "FREE", days: 60 },
  ],
  "mission-la-purisima": [
    { type: "coupon", title: "Annual Day Pass — $5 per vehicle", description: "Entrance fee for up to 8 passengers. Buy your California State Parks annual pass for unlimited visits.", discountText: "$5", days: 90 },
  ],
}

function daysFromNow(d) {
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date
}

async function seedCategory(sql, businesses, categoryId, categoryName, ownerId) {
  console.log(`\n--- ${categoryName} (${businesses.length} businesses) ---`)
  const slugToId = {}
  let inserted = 0
  let skipped = 0

  for (const b of businesses) {
    const rows = await sql`
      insert into businesses (
        owner_user_id, name, slug, description, category_id,
        address, lat, lng, phone, website, status
      )
      values (
        ${ownerId},
        ${b.name},
        ${b.slug},
        ${b.description},
        ${categoryId},
        ${b.address},
        ${b.lat},
        ${b.lng},
        ${b.phone ?? null},
        ${b.website ?? null},
        'approved'
      )
      on conflict (slug) do nothing
      returning id
    `
    if (rows.length > 0) {
      slugToId[b.slug] = rows[0].id
      inserted++
      console.log(`  ✓ ${b.name}`)
    } else {
      const existing = await sql`select id from businesses where slug = ${b.slug}`
      if (existing.length > 0) slugToId[b.slug] = existing[0].id
      skipped++
      console.log(`  ~ ${b.name} (already exists)`)
    }
  }

  console.log(`  Inserted: ${inserted}, Skipped: ${skipped}`)
  return slugToId
}

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  console.log("== Seeding Lompoc businesses — all categories ==\n")

  // Ensure system owner exists
  const placeholderHash = await bcrypt.hash("placeholder-not-for-login-" + Math.random(), 10)
  await sql`
    insert into users (email, password_hash, role)
    values ('system@lompocdeals.test', ${placeholderHash}, 'business')
    on conflict (email) do nothing
  `
  const [owner] = await sql`select id from users where email = 'system@lompocdeals.test'`
  const ownerId = owner.id

  // Get categories
  const cats = await sql`select id, slug from categories`
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]))

  const required = ["retail", "services", "health-beauty", "auto", "entertainment", "other"]
  for (const slug of required) {
    if (!catBySlug[slug]) {
      console.error(`ERROR: '${slug}' category not found. Run seed.ts first.`)
      process.exit(1)
    }
  }

  // Seed each category
  const allSlugToId = {}
  const maps = [
    [RETAIL, catBySlug["retail"], "Retail"],
    [SERVICES, catBySlug["services"], "Services"],
    [HEALTH_BEAUTY, catBySlug["health-beauty"], "Health & Beauty"],
    [AUTO, catBySlug["auto"], "Auto"],
    [ENTERTAINMENT, catBySlug["entertainment"], "Entertainment"],
    [OTHER, catBySlug["other"], "Other"],
  ]

  for (const [bizList, catId, catName] of maps) {
    const slugToId = await seedCategory(sql, bizList, catId, catName, ownerId)
    Object.assign(allSlugToId, slugToId)
  }

  // Insert deals
  console.log("\n--- Deals ---")
  let dealCount = 0
  for (const [slug, dealList] of Object.entries(DEALS)) {
    const businessId = allSlugToId[slug]
    if (!businessId) {
      console.log(`  ✗ No id for slug "${slug}", skipping deals`)
      continue
    }
    for (const d of dealList) {
      await sql`
        insert into deals (
          business_id, type, title, description, discount_text,
          starts_at, expires_at
        )
        values (
          ${businessId},
          ${d.type},
          ${d.title},
          ${d.description},
          ${d.discountText ?? null},
          now(),
          ${daysFromNow(d.days).toISOString()}
        )
      `
      dealCount++
    }
  }
  console.log(`  ✓ ${dealCount} deals inserted`)

  // Summary
  const [bizCount] = await sql`select count(*)::int as n from businesses where status = 'approved'`
  const [dealTotal] = await sql`select count(*)::int as n from deals`
  console.log(`\n== Done ==`)
  console.log(`  Total approved businesses: ${bizCount.n}`)
  console.log(`  Total deals: ${dealTotal.n}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
