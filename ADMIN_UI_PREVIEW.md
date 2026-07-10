# Admin Dashboard UI Preview

## 🎨 Visual Design Language

### Color System
```
Primary Brand:   #702DFF (Violet-600)
Success States:  #10B981 (Emerald-500)
Warning States:  #F59E0B (Amber-500)
Error States:    #EF4444 (Rose-500)
Info States:     #3B82F6 (Blue-500)
```

### Component Hierarchy

#### 1. Dashboard Overview
```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 Dashboard Overview                [All Systems Operational]│
│ Monitor platform health, manage resources, track activity    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│ │ 👥 247   │  │ 🖥️  24   │  │ 🧪 12    │  │ 📡 18 ●  │    │
│ │ Users    │  │ Infra    │  │ Labs     │  │ Live     │    │
│ │ +12% ↑   │  │ +4 ↑     │  │ +3 ↑     │  │ Sessions │    │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│ │ ✓ 99.97% │  │ ⚡ 142ms  │  │ 📊 34%   │  │ 🛡️  A+   │    │
│ │ Uptime   │  │ Response │  │ CPU      │  │ Security │    │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│ ┌─────────────────────────┐  ┌─────────────────────────┐   │
│ │ Infrastructure Status   │  │ Active Workshops        │   │
│ │ ━━━━━━━━━━━━━━ 75%     │  │ • NKP Enterprise Deploy │   │
│ │ ━━━━━ 12.5%             │  │   45 users • 68% [Live] │   │
│ │ ━━ 8.3%                 │  │ • Advanced Ops          │   │
│ │ ▪ 4.2%                  │  │   32 users [Scheduled]  │   │
│ └─────────────────────────┘  └─────────────────────────┘   │
│                                                               │
│ ┌─────────────────────────┐  ┌─────────────────────────┐   │
│ │ Recent Activity         │  │ Quick Actions           │   │
│ │ ✓ Assigned alice → NKP  │  │ ┌─────────────────────┐ │   │
│ │ ▶ nkp-prod-07 ready     │  │ │ 🖥️ Provision Machine │ │   │
│ │ ℹ Added 5 users         │  │ └─────────────────────┘ │   │
│ │ ⚠ High memory usage     │  │ ┌─────────────────────┐ │   │
│ └─────────────────────────┘  │ │ 👤 Add Users         │ │   │
│                                │ └─────────────────────┘ │   │
└───────────────────────────────└─────────────────────────┘   │
```

#### 2. User Management
```
┌─────────────────────────────────────────────────────────────┐
│ 👥 User Management                                           │
│ Manage user accounts, roles, and access permissions         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│ │ 👥 247   │  │ ✓ 239    │  │ 🔐 8     │  │ ⏰ +5    │    │
│ │ Total    │  │ Active   │  │ Admins   │  │ This Week│    │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐│
│ │ USER         │ ROLE          │ STATUS  │ ACTIONS        ││
│ ├───────────────────────────────────────────────────────────┤│
│ │ [A] alice    │ [▼Admin]      │ ● Active│ [Reset] [Del] ││
│ │ abc123...    │               │         │                ││
│ ├───────────────────────────────────────────────────────────┤│
│ │ [B] bshaw    │ [▼User]       │ ● Active│ [Reset] [Del] ││
│ │ def456...    │               │         │                ││
│ └───────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Infrastructure Management
```
┌─────────────────────────────────────────────────────────────┐
│ 🖥️ Infrastructure Management                                │
│ Provision, monitor, and manage workshop machines            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│ │ 🖥️  24   │  │ ✓ 18     │  │ ⚙️  3    │  │ ⚠️  3    │    │
│ │ Total    │  │ Ready    │  │ Provision│  │ Issues   │    │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│ │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │         │
│ │ │🖥️nkp-01 │ │  │ │🖥️nkp-02 │ │  │ │🖥️nkp-03 │ │         │
│ │ │● Ready  │ │  │ │⚠️Error  │ │  │ │⚙️Prov...│ │         │
│ │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │         │
│ │             │  │             │  │             │         │
│ │ v1.29 • 3n  │  │ v1.29 • 3n  │  │ v1.30 • 4n  │         │
│ │ 8vCPU•32GB  │  │ 8vCPU•32GB  │  │ 16vCPU•64GB │         │
│ │ alice•4d12h │  │ bshaw•0d3h  │  │ unass•0d0h  │         │
│ │             │  │             │  │             │         │
│ │ [View Logs] │  │ [View Logs] │  │ [View Logs] │         │
│ └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### 4. Lab Credentials Management
```
┌─────────────────────────────────────────────────────────────┐
│ 🔑 Lab Credentials Management                               │
│ Manage RDP access and assign credentials to participants    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│ │ 🔑 24    │  │ ✓ 18     │  │ ⏰ 3     │  │ ✕ 3     │    │
│ │ Total    │  │ Active   │  │ Pending  │  │ Revoked  │    │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐│
│ │ USER    │ LAB         │ MACHINE │ HOST     │ CRED │STATUS││
│ ├───────────────────────────────────────────────────────────┤│
│ │ [A]alice│ NKP Cluster │ nkp-01  │10.42.0.5 │[👁️] │●Active││
│ ├───────────────────────────────────────────────────────────┤│
│ │ [B]bshaw│ Cluster API │ nkp-02  │10.42.0.7 │[👁️] │●Active││
│ ├───────────────────────────────────────────────────────────┤│
│ │ ┌─────────────────────────────────────────────────────┐  ││
│ │ │ Connection Details                                   │  ││
│ │ │ [RDP Host: 10.42.0.5:3389 📋] [Username: lab 📋]    │  ││
│ │ │ [Password: Xk9$vLp2Qz 📋]                           │  ││
│ │ └─────────────────────────────────────────────────────┘  ││
│ └───────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### 5. Platform Settings
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ Platform Settings                                        │
│ Configure platform identity, infrastructure, and preferences │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚙️ Platform Identity                                    │ │
│ │ General information shown to all platform users         │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Platform Name                                           │ │
│ │ [Nutanix NKP Workshop                                 ] │ │
│ │ Displayed in the header and login page                  │ │
│ │                                                         │ │
│ │ Support Email                                           │ │
│ │ [support@nutanix.com                                  ] │ │
│ │ Contact address for participant inquiries               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🖥️ Infrastructure Defaults                             │ │
│ │ Applied to new machine provisions unless overridden     │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Kubernetes Version    [v1.29  ]  Node Count  [3     ]  │ │
│ │ vCPU per Node        [8      ]  Memory       [32 GiB]  │ │
│ │ Guacamole Host       [guac.nkp-workshop.internal:8080] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🛡️ Security & Access Control                           │ │
│ │ Configure authentication and session management         │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Session Timeout      [720     ] minutes                 │ │
│ │ Min Password Length  [8       ] characters              │ │
│ │ Two-Factor Auth      [🟢 Enabled  ]                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 Branding & Theme                                     │ │
│ │ Customize visual identity and color scheme              │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [●] #702DFF Brand Primary [Enterprise] [Change Color]   │ │
│ │                                                         │ │
│ │ [█ Primary] [█ Success] [█ Warning] [█ Error]          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ [✓ Save Changes] [Reset to Defaults] [Cancel]              │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key UX Improvements

### 1. **Information Hierarchy**
- Clear visual separation between sections
- Prominent headers with descriptions
- Card-based layouts for grouped information
- Consistent spacing and padding

### 2. **Interactive Elements**
- Hover states with elevation changes
- Smooth transitions (300ms duration)
- Animated indicators for live/active states
- Color-coded status badges

### 3. **Data Visualization**
- Progress bars for status distribution
- Metric cards with trend indicators
- Activity feed with chronological display
- Status badges with live pulse animations

### 4. **Accessibility**
- High contrast text (WCAG AA compliant)
- Clear focus indicators
- Icon + text labels for clarity
- Consistent touch target sizes (minimum 44px)

### 5. **Responsive Design**
- Grid layouts adapt to screen size (2-4 columns)
- Mobile-first approach
- Flexible card layouts
- Breakpoints: md (768px), lg (1024px)

## 🚀 Modern UI Patterns

### Gradient Accents
```css
/* Bottom border gradient on hover */
from-violet-500 to-purple-500
/* Avatar backgrounds */
from-violet-500 to-purple-600
/* Icon backgrounds */
from-violet-100 to-violet-50
```

### Status Indicators
- **Green (Emerald)**: Success, Ready, Active
- **Yellow (Amber)**: Warning, Pending, Provisioning
- **Red (Rose)**: Error, Offline, Revoked
- **Blue**: Info, Scheduled

### Card Interactions
- Default: subtle border, light shadow
- Hover: lift effect (-translate-y), enhanced shadow
- Active: gradient bottom border reveal

### Typography Scale
- Page Title: 3xl (30px), bold
- Section Title: lg (18px), semibold
- Body: sm (14px), regular
- Labels: xs (12px), medium, uppercase
- Monospace: for technical data

## 📱 Responsive Breakpoints

```
Mobile:    < 768px   (Single column)
Tablet:    768px+    (2 columns)
Desktop:   1024px+   (3-4 columns)
Wide:      1280px+   (4 columns max)
```

## 🎨 Component Gallery

### Metric Cards
- Icon badge (colored background circle)
- Large numeric display (monospace font)
- Trend indicator with arrow
- Subtitle with context

### Status Badges
- Rounded full (pill shape)
- Dot indicator
- Color-coded background (12% opacity)
- Animated pulse for live states

### Action Buttons
- Primary: Violet background, white text
- Secondary: Border, transparent background
- Ghost: No border, transparent, muted text
- Destructive: Red background (for delete actions)

### Data Tables
- Muted header background
- Uppercase column labels
- Row hover states
- Inline action buttons
- Expandable rows for details

### Form Controls
- Rounded borders
- Focus rings (primary color, 20% opacity)
- Helper text below inputs
- Label + input + description pattern
- Toggle switches for boolean settings

This redesign creates a professional, enterprise-grade admin dashboard that rivals commercial SaaS platforms like Datadog, Vercel, or AWS Console.
