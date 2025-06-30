/*
  # Create sample data for testing

  1. Sample Papers
    - Create realistic research papers for testing
    - Include comprehensive metadata and content
    - Cover different research domains (healthcare, finance, collaboration)

  2. Note on Admin User
    - Admin users must be created through Supabase Auth UI or API
    - Cannot directly insert into auth.users table via SQL
    - The users table will be populated automatically when admin signs up

  3. Sample Data Structure
    - Papers with realistic academic content
    - Proper metadata including journals, dates, keywords
    - Content suitable for AI analysis testing
*/

-- Create some sample papers for testing the application
INSERT INTO papers (
  title,
  authors,
  content,
  metadata
) VALUES 
(
  'Machine Learning Ethics in Healthcare Applications',
  ARRAY['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez'],
  'This comprehensive study examines the ethical implications of machine learning applications in healthcare settings. The research focuses on bias detection, fairness metrics, and transparency requirements for AI systems used in medical diagnosis and treatment recommendations. Our methodology involved analyzing 500 healthcare AI systems across 50 hospitals, evaluating their decision-making processes, and identifying potential sources of bias. The results demonstrate significant variations in AI performance across different demographic groups, highlighting the need for more robust ethical frameworks and regulatory oversight in healthcare AI deployment. The study employed both quantitative and qualitative research methods, including statistical analysis of AI decision patterns and interviews with healthcare professionals. Key findings include a 23% variation in diagnostic accuracy across different ethnic groups, with particularly concerning disparities in cardiovascular and oncological applications. The research also identified significant gaps in current regulatory frameworks, with only 15% of surveyed institutions having comprehensive AI ethics review processes. Our recommendations include mandatory bias testing, diverse training datasets, regular algorithmic audits, and enhanced transparency requirements for healthcare AI systems.',
  jsonb_build_object(
    'journal', 'Journal of Medical AI Ethics',
    'publishedDate', '2024-01-15',
    'keywords', ARRAY['machine learning', 'healthcare', 'ethics', 'bias detection', 'fairness', 'transparency'],
    'abstract', 'A comprehensive analysis of ethical considerations in healthcare AI systems, examining bias detection and transparency requirements.',
    'wordCount', 1250,
    'pageCount', 12,
    'doi', '10.1234/jmai.2024.001',
    'citations', 45,
    'uploadedBy', 'system'
  )
),
(
  'Explainable AI for Financial Risk Assessment',
  ARRAY['Prof. David Kim', 'Dr. Lisa Wang'],
  'This paper presents a novel framework for implementing explainable artificial intelligence in financial risk assessment systems. The study addresses the critical need for transparency in AI-driven financial decisions, particularly in loan approval and credit scoring applications. Our approach combines advanced machine learning techniques with interpretability methods to ensure that financial institutions can provide clear explanations for AI-driven decisions. The research includes case studies from three major banks and demonstrates improved decision transparency while maintaining predictive accuracy. The methodology incorporates LIME (Local Interpretable Model-agnostic Explanations) and SHAP (SHapley Additive exPlanations) techniques to provide feature-level explanations for individual predictions. Results show that our explainable AI framework maintains 94% of the original model accuracy while providing comprehensible explanations for 98% of decisions. The study also reveals that explainable AI implementations lead to increased customer trust and regulatory compliance. Financial institutions reported a 35% reduction in customer complaints and a 50% improvement in regulatory audit outcomes when using our framework.',
  jsonb_build_object(
    'journal', 'Financial Technology Review',
    'publishedDate', '2024-02-20',
    'keywords', ARRAY['explainable AI', 'financial services', 'risk assessment', 'transparency', 'LIME', 'SHAP'],
    'abstract', 'A framework for implementing explainable AI in financial risk assessment with case studies from major banks.',
    'wordCount', 980,
    'pageCount', 8,
    'doi', '10.1234/ftr.2024.002',
    'citations', 28,
    'uploadedBy', 'system'
  )
),
(
  'Collaborative AI Research: Best Practices and Ethical Guidelines',
  ARRAY['Dr. Amanda Foster', 'Prof. Robert Martinez', 'Dr. Jennifer Liu'],
  'This research establishes comprehensive guidelines for collaborative artificial intelligence research, focusing on ethical considerations, data sharing protocols, and transparency requirements. The study surveyed 200 AI research teams across academic and industry settings to identify best practices for collaborative AI development. Key findings include the importance of diverse team composition, clear ethical guidelines, and robust peer review processes. The paper provides a framework for establishing ethical AI research collaborations that prioritize transparency, accountability, and social benefit. The research methodology combined quantitative surveys with qualitative interviews and case study analysis. Survey results indicate that teams with diverse backgrounds (gender, ethnicity, disciplinary) produce 40% more innovative solutions and identify 60% more potential ethical issues during development. The study also found that institutions with formal AI ethics review boards have 75% fewer post-deployment ethical incidents. Our proposed framework includes five key components: diverse team formation protocols, standardized ethics review processes, transparent data sharing agreements, collaborative peer review mechanisms, and continuous monitoring systems. Implementation guidelines are provided for academic institutions, industry research labs, and cross-sector collaborations.',
  jsonb_build_object(
    'journal', 'AI Research Ethics Quarterly',
    'publishedDate', '2024-03-10',
    'keywords', ARRAY['collaborative research', 'AI ethics', 'best practices', 'transparency', 'diversity', 'peer review'],
    'abstract', 'Comprehensive guidelines for ethical collaborative AI research practices based on survey of 200 research teams.',
    'wordCount', 1450,
    'pageCount', 15,
    'doi', '10.1234/areq.2024.003',
    'citations', 67,
    'uploadedBy', 'system'
  )
),
(
  'Bias Detection in Natural Language Processing Models',
  ARRAY['Dr. Maria Gonzalez', 'Prof. James Thompson'],
  'This study presents a comprehensive analysis of bias detection methods in natural language processing models, with particular focus on gender, racial, and cultural biases in large language models. The research evaluates existing bias detection frameworks and proposes novel metrics for measuring and mitigating bias in NLP applications. Our methodology includes analysis of 15 popular language models across 8 different bias categories, using both automated detection tools and human evaluation studies. Results demonstrate that current bias detection methods capture only 60% of human-identified biases, highlighting the need for more sophisticated detection approaches. The study introduces the Comprehensive Bias Evaluation Framework (CBEF), which combines statistical analysis, semantic similarity measures, and human judgment to provide more accurate bias assessment. Testing on GPT-3, BERT, and other models shows that CBEF identifies 85% more bias instances compared to existing methods. The research also provides practical recommendations for model developers, including bias-aware training procedures, diverse evaluation datasets, and continuous monitoring protocols.',
  jsonb_build_object(
    'journal', 'Computational Linguistics Review',
    'publishedDate', '2024-01-28',
    'keywords', ARRAY['bias detection', 'natural language processing', 'large language models', 'fairness', 'evaluation'],
    'abstract', 'Analysis of bias detection methods in NLP models with introduction of Comprehensive Bias Evaluation Framework.',
    'wordCount', 1180,
    'pageCount', 10,
    'doi', '10.1234/clr.2024.004',
    'citations', 52,
    'uploadedBy', 'system'
  )
),
(
  'Transparency and Accountability in Automated Decision Systems',
  ARRAY['Prof. Rachel Adams', 'Dr. Kevin Park', 'Dr. Sophia Chen'],
  'This paper examines the implementation of transparency and accountability measures in automated decision systems across government and private sector applications. The research analyzes regulatory frameworks, technical implementation challenges, and stakeholder perspectives on algorithmic transparency. Through case studies of automated systems in criminal justice, hiring, and social services, we identify key factors that contribute to successful transparency implementations. The study employed mixed-methods research including policy analysis, technical audits, and stakeholder interviews across 25 organizations. Findings reveal that successful transparency implementations require three critical components: technical infrastructure for explainability, organizational processes for accountability, and stakeholder engagement mechanisms. Organizations with comprehensive transparency frameworks report 45% higher public trust scores and 30% fewer legal challenges. The research also identifies significant implementation barriers, including technical complexity, cost considerations, and resistance to change. Our recommendations include standardized transparency metrics, phased implementation approaches, and multi-stakeholder governance models for automated decision systems.',
  jsonb_build_object(
    'journal', 'Digital Governance Quarterly',
    'publishedDate', '2024-02-05',
    'keywords', ARRAY['transparency', 'accountability', 'automated decisions', 'governance', 'algorithmic auditing'],
    'abstract', 'Examination of transparency and accountability measures in automated decision systems with case studies and recommendations.',
    'wordCount', 1320,
    'pageCount', 13,
    'doi', '10.1234/dgq.2024.005',
    'citations', 38,
    'uploadedBy', 'system'
  )
);

-- Note: To create an admin user, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" 
-- 3. Use email: admin@sciai-trust.com
-- 4. Set a secure password
-- 5. The user profile will be automatically created in the users table when they first sign in
-- 6. You can then update their role to 'admin' through the dashboard or by running:
--    UPDATE users SET role = 'admin' WHERE email = 'admin@sciai-trust.com';

-- Create a comment to remind about admin user creation
DO $$
BEGIN
  RAISE NOTICE 'Sample data created successfully!';
  RAISE NOTICE 'To create admin user:';
  RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
  RAISE NOTICE '2. Add user with email: admin@sciai-trust.com';
  RAISE NOTICE '3. After first login, update role: UPDATE users SET role = ''admin'' WHERE email = ''admin@sciai-trust.com'';';
END $$;