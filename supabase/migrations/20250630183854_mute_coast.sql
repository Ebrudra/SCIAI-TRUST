/*
  # Create Admin User Account

  1. Admin User Creation
    - Insert admin user directly into auth.users
    - Create corresponding profile in users table
    - Set admin role and permissions

  2. Sample Data
    - Add some sample papers and summaries for testing
    - Create sample feedback and activity logs
*/

-- Insert admin user into auth.users (this would typically be done through Supabase Auth)
-- For development, we'll create the user profile directly

-- Create admin user profile
INSERT INTO users (
  id,
  email,
  name,
  role,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin@sciai-trust.com',
  'Admin User',
  'admin',
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  name = 'Admin User';

-- Create some sample data for testing
INSERT INTO papers (
  title,
  authors,
  content,
  metadata
) VALUES 
(
  'Machine Learning Ethics in Healthcare Applications',
  ARRAY['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez'],
  'This comprehensive study examines the ethical implications of machine learning applications in healthcare settings. The research focuses on bias detection, fairness metrics, and transparency requirements for AI systems used in medical diagnosis and treatment recommendations. Our methodology involved analyzing 500 healthcare AI systems across 50 hospitals, evaluating their decision-making processes, and identifying potential sources of bias. The results demonstrate significant variations in AI performance across different demographic groups, highlighting the need for more robust ethical frameworks and regulatory oversight in healthcare AI deployment.',
  jsonb_build_object(
    'journal', 'Journal of Medical AI Ethics',
    'publishedDate', '2024-01-15',
    'keywords', ARRAY['machine learning', 'healthcare', 'ethics', 'bias detection'],
    'abstract', 'A comprehensive analysis of ethical considerations in healthcare AI systems.',
    'wordCount', 1250,
    'pageCount', 12
  )
),
(
  'Explainable AI for Financial Risk Assessment',
  ARRAY['Prof. David Kim', 'Dr. Lisa Wang'],
  'This paper presents a novel framework for implementing explainable artificial intelligence in financial risk assessment systems. The study addresses the critical need for transparency in AI-driven financial decisions, particularly in loan approval and credit scoring applications. Our approach combines advanced machine learning techniques with interpretability methods to ensure that financial institutions can provide clear explanations for AI-driven decisions. The research includes case studies from three major banks and demonstrates improved decision transparency while maintaining predictive accuracy.',
  jsonb_build_object(
    'journal', 'Financial Technology Review',
    'publishedDate', '2024-02-20',
    'keywords', ARRAY['explainable AI', 'financial services', 'risk assessment', 'transparency'],
    'abstract', 'A framework for implementing explainable AI in financial risk assessment.',
    'wordCount', 980,
    'pageCount', 8
  )
),
(
  'Collaborative AI Research: Best Practices and Ethical Guidelines',
  ARRAY['Dr. Amanda Foster', 'Prof. Robert Martinez', 'Dr. Jennifer Liu'],
  'This research establishes comprehensive guidelines for collaborative artificial intelligence research, focusing on ethical considerations, data sharing protocols, and transparency requirements. The study surveyed 200 AI research teams across academic and industry settings to identify best practices for collaborative AI development. Key findings include the importance of diverse team composition, clear ethical guidelines, and robust peer review processes. The paper provides a framework for establishing ethical AI research collaborations that prioritize transparency, accountability, and social benefit.',
  jsonb_build_object(
    'journal', 'AI Research Ethics Quarterly',
    'publishedDate', '2024-03-10',
    'keywords', ARRAY['collaborative research', 'AI ethics', 'best practices', 'transparency'],
    'abstract', 'Guidelines for ethical collaborative AI research practices.',
    'wordCount', 1450,
    'pageCount', 15
  )
);