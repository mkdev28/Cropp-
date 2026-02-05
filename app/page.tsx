import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Leaf,
  Shield,
  TrendingUp,
  MapPin,
  Satellite,
  Cloud,
  Database,
  CheckCircle2,
  ArrowRight,
  IndianRupee,
  Users,
  AlertTriangle,
  Sparkles,
  Building2,
  Tractor
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">AgriRisk Pro</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Problem', 'Solution', 'Features'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/insurance">
              <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary">
                Log In
              </Button>
            </Link>
            <Link href="/assess">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-full px-6">
                Get Risk Score
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Subtle Earthy Glows */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-1.5 text-sm rounded-full">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Revolutionizing Crop Insurance
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              Fair Insurance Through <br />
              <span className="text-primary italic">Precision Data</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop relying on district-level averages. We combine satellite imagery, soil data, and weather patterns to generate a unique risk score for every single farm.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/assess">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105">
                  <Tractor className="h-5 w-5 mr-2" />
                  I'm a Farmer
                </Button>
              </Link>
              <Link href="/dashboard/insurance">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-secondary/50">
                  <Building2 className="h-5 w-5 mr-2" />
                  I'm an Insurer
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border/50 pt-10 max-w-3xl mx-auto">
              {[
                { label: '5+ Data Sources', desc: 'Satellite to Soil' },
                { label: 'Real-time Analysis', desc: 'Instant Risk Scoring' },
                { label: 'Fraud Detection', desc: 'AI-Powered Verification' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{stat.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- PROBLEM SECTION --- */}
      <section id="problem" className="py-24 bg-secondary/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">The Current System is Broken</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Good farmers subsidize bad practices because insurers can't tell the difference. This leads to a loss spiral where everyone loses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Bad Scenario */}
            <Card className="glass border-destructive/20 bg-destructive/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className="h-24 w-24 text-destructive" />
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-xl font-bold shadow-sm">A</div>
                  <div>
                    <h3 className="font-bold text-lg">Traditional Model</h3>
                    <p className="text-sm text-destructive font-medium">District Level Average</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                    <span className="text-sm">Low Risk Farmer</span>
                    <span className="font-mono font-bold">₹5,000 Premium</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                    <span className="text-sm">High Risk Farmer</span>
                    <span className="font-mono font-bold">₹5,000 Premium</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground italic">
                  "Why should I pay the same as my neighbor who doesn't irrigate?"
                </p>
              </CardContent>
            </Card>

            {/* Solution Scenario */}
            <Card className="glass border-primary/20 bg-primary/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                <Leaf className="h-24 w-24 text-primary" />
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/20">B</div>
                  <div>
                    <h3 className="font-bold text-lg">AgriRisk Pro</h3>
                    <p className="text-sm text-primary font-medium">Farm Level Precision</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-primary/10 shadow-sm">
                    <span className="text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      Low Risk Farmer
                    </span>
                    <span className="font-mono font-bold text-primary">₹2,800 Premium</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-border/50">
                    <span className="text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-destructive"></span>
                      High Risk Farmer
                    </span>
                    <span className="font-mono font-bold text-muted-foreground">₹7,200 Premium</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground italic">
                  Fair pricing incentivizes better farming practices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* --- SOLUTION GRID --- */}
      <section id="solution" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold">Powered by 5-Point Data Fusion</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {[
              { icon: Satellite, label: 'Satellite', detail: 'NDVI Index' },
              { icon: Cloud, label: 'Weather', detail: 'Hyper-local' },
              { icon: MapPin, label: 'Soil', detail: 'N-P-K & Moisture' },
              { icon: Database, label: 'History', detail: 'Yield Records' },
              { icon: TrendingUp, label: 'Market', detail: 'Price Volatility' }
            ].map((source, index) => (
              <Card key={index} className="group hover:border-primary/50 transition-all hover:-translate-y-1 bg-card">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-2xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                    <source.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{source.label}</h3>
                  <p className="text-xs text-muted-foreground">{source.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURE HIGHLIGHTS --- */}
      <section id="features" className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-16 items-start max-w-6xl mx-auto">
            <div className="md:w-1/3">
              <Badge variant="outline" className="mb-6 text-primary border-primary">Tech Stack</Badge>
              <h2 className="text-4xl font-bold mb-6">Built for Scale and Speed.</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Our engine processes terabytes of data to deliver instant quotes. Whether you are insuring 10 farms or 10 million.
              </p>
              <Button variant="secondary" className="rounded-full">
                Read the Whitepaper
              </Button>
            </div>

            <div className="md:w-2/3 grid sm:grid-cols-2 gap-8">
              {[
                {
                  icon: Shield,
                  title: 'Fraud Detection',
                  desc: 'AI flags land inflation and fake irrigation claims instantly.'
                },
                {
                  icon: Users,
                  title: 'Trust System',
                  desc: 'Farmers build a credit-like "Trust Score" over time.'
                },
                {
                  icon: Cloud,
                  title: 'Proactive Alerts',
                  desc: 'SMS warnings for drought and pests before damage occurs.'
                },
                {
                  icon: IndianRupee,
                  title: 'Fast Settlement',
                  desc: 'Parametric triggers mean payouts happen in days, not months.'
                }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready to modernization your farm?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join the network of verified farms and get the insurance rate you actually deserve.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/assess">
              <Button size="lg" className="h-14 px-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg shadow-xl shadow-primary/20">
                Get Started
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-border/40 bg-secondary/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">AgriRisk Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 AgriRisk Pro. Built for India's Farmers.
          </p>
        </div>
      </footer>
    </div>
  );
}
