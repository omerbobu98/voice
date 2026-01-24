export const sampleTreeData = {
  id: 'sample-tree',
  name: 'Cool Life Paint Sales Flow',
  description: 'Interactive conversation tree for selling Cool Life Paint',
  product_type: 'cool_life_paint',
  industry: 'home_improvement',
  nodes: [
    {
      id: 'root',
      speaker: 'seller',
      node_type: 'root',
      title: 'Opening Introduction',
      content: "Hi! Thanks for taking the time to meet with me today. I'm here to show you how Cool Life Paint can transform your home and save you money on energy bills. Before I get started, tell me - what made you interested in learning about exterior coating solutions?",
      short_content: "Opening: Build rapport and discover initial interest",
      stage: 'opening',
      coaching_tips: [
        'Smile and maintain eye contact',
        'Use their name within first 30 seconds',
        'Ask an open-ended question to get them talking'
      ],
      why_it_works: "This opening works because it thanks them (creates reciprocity), positions you as helpful not salesy, and immediately gets THEM talking about THEIR needs. The question at the end puts control in their hands, which builds trust.",
      common_mistakes: [
        "Starting with 'Let me tell you about our product...'",
        "Launching into features before building rapport",
        "Not asking any questions in the first 60 seconds"
      ],
      practice_tip: "Record yourself doing this opening 5 times. Play it back - do you sound genuinely curious or like you're reading a script? Practice until it sounds natural.",
      children: [
        {
          id: 'engaged-1',
          speaker: 'customer',
          node_type: 'response',
          title: 'Customer Shows Interest',
          content: "Well, we've been dealing with really high electric bills in the summer, and a neighbor mentioned you helped them save money.",
          short_content: "Shows interest in energy savings",
          branch_label: 'Shows Interest',
          success_probability: 0.7,
          customer_mindset: "Hopeful but cautious. They have a real problem (high bills) and someone they trust referred them. They want a solution but have likely been disappointed before.",
          signals_to_notice: ["Mentions specific problem (bills)", "References trusted source (neighbor)", "Leans forward", "Makes eye contact", "Asks follow-up questions"],
          children: [
            {
              id: 'seller-discovery-1',
              speaker: 'seller',
              node_type: 'action',
              title: 'Discovery - Energy Pain',
              content: "That's exactly why most of my customers reach out! Tell me more - how much are you spending on electricity during peak summer months?",
              short_content: "Dig deeper into energy pain point",
              stage: 'discovery',
              coaching_tips: ['Get specific numbers', 'Show empathy for their frustration', 'Wait for full answer before responding', 'Nod to show active listening'],
              why_it_works: "By asking for specific numbers, you accomplish three things: 1) Get quantifiable data for ROI calculations, 2) Make the pain feel real and tangible, 3) Show you care about THEIR situation, not just making a sale.",
              common_mistakes: [
                "Accepting vague answers like 'a lot' without digging deeper",
                "Rushing to pitch before fully understanding their pain",
                "Making it about the product instead of their problem"
              ],
              practice_tip: "Practice asking follow-up questions that start with 'Tell me more about...' or 'How does that affect...' to dig deeper into pain points.",
              children: [
                {
                  id: 'customer-pain-1',
                  speaker: 'customer',
                  node_type: 'response',
                  title: 'Reveals High Bills',
                  content: "Last summer we were paying $400-500 a month! It's ridiculous. The AC just runs constantly.",
                  short_content: "High bills $400-500/month",
                  branch_label: 'Shares Pain',
                  success_probability: 0.8,
                  children: [
                    {
                      id: 'seller-amplify-1',
                      speaker: 'seller',
                      node_type: 'action',
                      title: 'Amplify Pain',
                      content: "Wow, $400-500 a month - that's nearly $2,500 just for summer cooling! Over 5 years that's $12,500 going straight to the electric company. What would you do with an extra $12,500?",
                      short_content: "Calculate long-term cost",
                      stage: 'pain_amplification',
                      coaching_tips: ['Use specific dollar amounts', 'Paint picture of opportunity cost'],
                      children: [
                        {
                          id: 'outcome-interested',
                          speaker: 'customer',
                          node_type: 'outcome',
                          title: 'Ready to Learn More',
                          content: "That's a lot of money... I never thought about it that way. What exactly does your paint do?",
                          short_content: "Engaged, wants solution",
                          outcome_type: 'next_step',
                          success_probability: 0.85,
                        }
                      ]
                    }
                  ]
                },
                {
                  id: 'customer-vague-1',
                  speaker: 'customer',
                  node_type: 'response',
                  title: 'Vague Response',
                  content: "I'm not sure exactly, but it's definitely more than I'd like.",
                  short_content: "Vague about specifics",
                  branch_label: 'Vague Answer',
                  success_probability: 0.5,
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: 'skeptical-1',
          speaker: 'customer',
          node_type: 'response',
          title: 'Customer Skeptical',
          content: "I've heard about these coating products before. They all claim to save money but do they really work?",
          short_content: "Expresses doubt about product claims",
          branch_label: 'Skeptical',
          success_probability: 0.4,
          children: [
            {
              id: 'seller-proof-1',
              speaker: 'seller',
              node_type: 'action',
              title: 'Provide Social Proof',
              content: "That's a great question, and honestly, you should be skeptical! Let me show you actual thermal imaging from homes in your neighborhood before and after Cool Life was applied. This is the Johnson home on Oak Street - see the difference?",
              short_content: "Show thermal imaging proof",
              stage: 'solution',
              coaching_tips: ['Use local examples', 'Visual proof is powerful', 'Validate their skepticism'],
              children: []
            }
          ]
        },
        {
          id: 'objection-1',
          speaker: 'customer',
          node_type: 'response',
          title: 'Price Objection Early',
          content: "Before we go any further - how much does this cost? I don't want to waste your time if it's out of our budget.",
          short_content: "Asks about price immediately",
          branch_label: 'Price Question',
          success_probability: 0.3,
          children: [
            {
              id: 'seller-defer-1',
              speaker: 'seller',
              node_type: 'action',
              title: 'Defer Price Discussion',
              content: "I appreciate you being upfront! The investment depends on your home's size and needs. But before we talk numbers, let me make sure this is even the right solution for you. Would that be fair?",
              short_content: "Defer price, establish value first",
              stage: 'objection',
              coaching_tips: ['Never give price before value', 'Use "investment" not "cost"', 'Get permission to continue'],
              children: [
                {
                  id: 'customer-agrees',
                  speaker: 'customer',
                  node_type: 'response',
                  title: 'Agrees to Continue',
                  content: "Sure, that makes sense. Go ahead.",
                  short_content: "Agrees to hear more",
                  branch_label: 'Agrees',
                  success_probability: 0.6,
                  children: []
                },
                {
                  id: 'customer-insists',
                  speaker: 'customer',
                  node_type: 'response',
                  title: 'Insists on Price',
                  content: "No, I really need a ballpark figure first.",
                  short_content: "Insists on knowing price",
                  branch_label: 'Insists',
                  success_probability: 0.35,
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: 'busy-1',
          speaker: 'customer',
          node_type: 'response',
          title: 'Customer Busy',
          content: "Look, I only have about 10 minutes. Can you give me the quick version?",
          short_content: "Time constraint",
          branch_label: 'Limited Time',
          success_probability: 0.25,
          children: []
        }
      ]
    }
  ]
};

export default sampleTreeData;
