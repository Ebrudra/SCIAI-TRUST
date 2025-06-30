import React from 'react';
import { Brain, Shield, Eye, Users, FileText, Zap, ArrowRight, CheckCircle, Star, Quote } from 'lucide-react';

interface HomepageProps {
  onGetStarted: () => void;
}

const Homepage: React.FC<HomepageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI models analyze research papers with transparency and explainable insights.',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Ethics & Bias Detection',
      description: 'Automatic identification of potential biases and ethical considerations in research.',
      color: 'green'
    },
    {
      icon: Eye,
      title: 'Explainable AI',
      description: 'Complete transparency into how AI makes decisions with detailed reasoning pathways.',
      color: 'purple'
    },
    {
      icon: Users,
      title: 'Collaborative Research',
      description: 'Share analyses, comment on findings, and collaborate with your research team.',
      color: 'orange'
    }
  ];

  const benefits = [
    'Save hours of manual paper analysis',
    'Identify potential biases and ethical issues',
    'Generate comprehensive summaries with citations',
    'Collaborate with team members seamlessly',
    'Export analyses in multiple formats',
    'Maintain academic integrity with usage declarations'
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Research Scientist, Stanford University',
      content: 'SciAI Trust Toolkit has revolutionized how we analyze literature. The ethics analysis feature is particularly valuable for ensuring our research maintains the highest standards.',
      rating: 5
    },
    {
      name: 'Prof. Michael Rodriguez',
      role: 'Department Head, MIT',
      content: 'The transparency and explainability features give us confidence in AI-assisted research. It\'s become an essential tool for our graduate students.',
      rating: 5
    },
    {
      name: 'Dr. Emily Watson',
      role: 'Principal Investigator, Johns Hopkins',
      content: 'Finally, an AI tool that prioritizes academic integrity. The collaboration features have improved our team\'s research efficiency significantly.',
      rating: 5
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Papers Analyzed' },
    { number: '500+', label: 'Research Teams' },
    { number: '95%', label: 'Accuracy Rate' },
    { number: '24/7', label: 'Available' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              AI Research Analysis
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Built for Trust
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Analyze scientific papers with transparent AI, detect biases, ensure ethics compliance, 
              and collaborate with confidence. The only research tool that prioritizes academic integrity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="group flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <span>Start Analyzing</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="flex items-center space-x-2 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                <FileText className="h-5 w-5" />
                <span>View Demo</span>
              </button>
            </div>
            
            <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free tier available</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Academic integrity focused</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Research
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to analyze research papers with confidence, transparency, and academic integrity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className={`h-6 w-6 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Researchers Choose SciAI Trust Toolkit
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of researchers who trust our platform for ethical, transparent, and collaborative research analysis.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={onGetStarted}
                className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started Today
              </button>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center space-x-3 mb-6">
                  <Zap className="h-8 w-8" />
                  <h3 className="text-2xl font-bold">Lightning Fast Analysis</h3>
                </div>
                <p className="text-blue-100 mb-6">
                  Analyze complex research papers in minutes, not hours. Our AI processes documents 
                  while maintaining the highest standards of academic integrity.
                </p>
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-sm text-blue-100 mb-2">Average Analysis Time</div>
                  <div className="text-3xl font-bold">2.5 minutes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Researchers
            </h2>
            <p className="text-xl text-gray-600">
              See what researchers from top institutions are saying about our platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <Quote className="h-8 w-8 text-gray-300 mb-4" />
                
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Research Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of researchers who trust SciAI Trust Toolkit for ethical, 
            transparent, and collaborative research analysis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors shadow-lg"
            >
              Start Your Free Analysis
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors">
              Schedule a Demo
            </button>
          </div>
          
          <p className="text-blue-200 text-sm mt-6">
            No credit card required • Free tier available • Academic discounts available
          </p>
        </div>
      </section>
    </div>
  );
};

export default Homepage;