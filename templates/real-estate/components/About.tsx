export function About() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              About Our Team
            </h2>
            <p className="text-xl text-gray-600">
              Dedicated professionals committed to your real estate success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Your Local Experts</h3>
              <p className="text-gray-600 mb-6">
                With over 15 years of combined experience in the local real estate market,
                our team has helped hundreds of families find their dream homes and successfully
                sell their properties. We pride ourselves on personalized service and staying
                current with the latest market trends.
              </p>
              <p className="text-gray-600 mb-6">
                Our commitment goes beyond transactions – we build lasting relationships
                and become trusted advisors for all your real estate needs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Properties Sold</span>
                  <span className="font-semibold">500+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Happy Clients</span>
                  <span className="font-semibold">450+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Years Experience</span>
                  <span className="font-semibold">15+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Knowledge</span>
                  <span className="font-semibold">Expert</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}