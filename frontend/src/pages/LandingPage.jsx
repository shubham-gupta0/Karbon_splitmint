import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import {
  DollarSign,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Group Management",
      description:
        "Create groups with up to 4 participants and track shared expenses effortlessly.",
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Smart Splitting",
      description:
        "Split expenses equally, by custom amounts, or by percentage—your choice.",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Beautiful Analytics",
      description:
        "Visualize spending patterns with gorgeous charts and insights.",
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Instant Settlements",
      description:
        "Get optimal payment suggestions to settle balances with minimum transactions.",
    },
  ];

  const benefits = [
    "No more awkward money conversations",
    "Track who owes what in real-time",
    "Split bills fairly and automatically",
    "Works great for roommates, trips, and events",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50">
      <Header />

      {/* Hero Section */}
      <section className="container px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Split expenses beautifully
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent">
            Split expenses with elegance
          </h1>

          <p className="text-xl md:text-2xl text-neutral-600 mb-10 max-w-2xl mx-auto">
            The most beautiful way to track shared expenses. Perfect for
            roommates, trips, and group activities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="group">
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Benefits */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-neutral-700">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Everything you need
          </h2>
          <p className="text-xl text-neutral-600">
            Powerful features wrapped in a beautiful interface
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-neutral-600 text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-2xl"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to simplify your shared expenses?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of users who split expenses the smart way
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="group">
              Create Free Account
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container px-4 py-8 border-t border-neutral-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="font-display font-bold text-lg">SplitMint</span>
          </div>
          <p className="text-sm text-neutral-500">
            © 2026 SplitMint. Made with ❤️ for fair sharing.
          </p>
        </div>
      </footer>
    </div>
  );
}
